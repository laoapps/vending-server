// src/controllers/booking.controller.ts
import { Request, Response } from 'express';
import { Model, Op } from 'sequelize';
import { generateQR } from '../services/lakService';
import { publishMqttMessage } from '../services/mqttService';
import redis from '../config/redis';
import models from '../models';
import { notifyStakeholders } from '../services/wsService';
import { activateLock } from '../services/lockService';
import { notilaabx_smartcb } from '../services/notificationService';
import { DeviceService } from '../services/deviceService';


export class BookingController {
  // USER: Create booking
  static async create(req: Request, res: Response) {
    const userUuid = res.locals.user.uuid;
    const token = res.locals.user.token;
    const {
      roomId,
      checkIn,        // optional for condo kWh-only
      checkOut,       // optional for condo kWh-only
      guests = 1,
      kwhAmount = 0,  // optional for hotel & rental-only
    } = req.body;

    try {
      const room = await models.Room.findByPk(roomId, { include: ['device'] });
      if (!room) return res.status(404).json({ error: 'Room not found' });
      if (!room.dataValues.deviceId) return res.status(400).json({ error: 'No device assigned' });



      const deviceId = room.dataValues.deviceId;

      // === SHARED LOCK WITH VENDING SYSTEM ===
      const activeLock = await redis.get(`deviceID:${deviceId}`);
      if (activeLock) {
        return res.status(400).json({
          error: 'This Smart CB is currently in use (vending or another booking). Please try again later.'
        });
      }
      // Temp lock the device (3 minutes — same as vending)
      await redis.setex(`deviceID:${deviceId}`, 3 * 60, JSON.stringify({
        deviceId,
        time: new Date(),
        type: 'hotel_booking',
        roomId
      }));


      let rentalPrice = 0;
      let electricityPrice = 0;
      let checkInDate: Date | null = null;
      let checkOutDate: Date | null = null;

      // === HOTEL MODE (time_only) ===
      if (room.roomType === 'time_only') {
        if (!checkIn || !checkOut) {
          await redis.del(`deviceID:${deviceId}`); // unlock on error
          return res.status(400).json({ error: 'Check-in and check-out dates required' });
        }

        checkInDate = new Date(checkIn);
        checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / 86400000);
        if (nights <= 0) {
          await redis.del(`deviceID:${deviceId}`); // unlock on error
          return res.status(400).json({ error: 'Invalid dates' })
        };

        rentalPrice = Number(room.dataValues.price) * nights; //* guests;
      }

      // === CONDO MODE (kwh_only or both) ===
      else if (room.dataValues.roomType === 'kwh_only' || room.dataValues.roomType === 'both') {
        const kwhPrice = room.dataValues.kwhPrice && room.dataValues.kwhPrice > 0 ? Number(room.dataValues.kwhPrice) : Number(room.dataValues.price);

        electricityPrice = kwhPrice * kwhAmount;

        // Rental is OPTIONAL
        if (checkIn && checkOut) {
          checkInDate = new Date(checkIn);
          checkOutDate = new Date(checkOut);
          const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / 86400000);
          if (nights < 0) {
            await redis.del(`deviceID:${deviceId}`); // unlock on error
            return res.status(400).json({ error: 'Invalid dates' })
          };

          rentalPrice = Number(room.dataValues.price) * nights;//* guests;
        }
      } else {
        await redis.del(`deviceID:${deviceId}`); // unlock on error
        return res.status(400).json({ error: 'Unsupported room type' });
      }

      const totalPrice = rentalPrice + electricityPrice;
      if (totalPrice <= 0) {
        await redis.del(`deviceID:${deviceId}`); // unlock on error
        return res.status(400).json({ error: 'Total price must be > 0' })
      };

      // === OVERLAP CHECK (only if dates exist) ===
      // === OVERLAP CHECK (only if dates exist) ===
      if (checkInDate && checkOutDate) {
        const now = new Date();
        const holdMinutes = 3;
        const holdTime = new Date(now.getTime() - holdMinutes * 60 * 1000);

        const conflicting = await models.Booking.findOne({
          where: {
            roomId,
            status: { [Op.notIn]: ['cancelled', 'checked_out'] },
            [Op.or]: [
              // 1. Paid bookings → always block
              {
                status: 'paid',
                [Op.or]: [
                  { checkIn: { [Op.lt]: checkOutDate } },
                  { checkOut: { [Op.gt]: checkInDate } },
                ],
              },
              // 2. Pending bookings → only block if recent (within hold time)
              {
                status: 'pending',
                createdAt: { [Op.gte]: holdTime },
                [Op.or]: [
                  { checkIn: { [Op.lt]: checkOutDate } },
                  { checkOut: { [Op.gt]: checkInDate } },
                ],
              },
            ],
          },
        });

        if (conflicting) {
          if (conflicting.status === 'paid') {
            await redis.del(`deviceID:${deviceId}`); // unlock on error
            return res.status(400).json({ error: 'Room already booked for these dates' });
          } else {
            await redis.del(`deviceID:${deviceId}`); // unlock on error
            return res.status(400).json({
              error: `Room is temporarily held by another user. Please try again in ${holdMinutes} minutes or choose different dates.`,
            });
          }
        }
      }

      // === CREATE BOOKING ===
      const booking = await models.Booking.create({
        roomId,
        userUuid,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        totalPrice,
        conditionType: kwhAmount > 0 ? 'energy_consumption' : 'time_duration',
        conditionValue: kwhAmount > 0 ? kwhAmount : null,
        status: 'pending',
      });

      const qrCode = await generateQR(booking.dataValues.id, totalPrice, req.headers.authorization?.split(' ')[1] || '');

      // Temp block room
      await redis.setex(`hotel_room_booked:${roomId}`, 300, '1');
      await redis.setex(`bookingID_laabxapp:${booking.dataValues.id}`, 5 * 60, + '');

      res.json({
        success: true,
        booking,
        qrCode,
        paymentData: { amount: totalPrice },
        breakdown: { rentalPrice, electricityPrice }
      });

    } catch (err: any) {
      const roomId = req.body.roomId;
      if (roomId) {
        const room = await models.Room.findByPk(roomId);
        if (room?.dataValues.deviceId) await redis.del(`deviceID:${room.dataValues.deviceId}`);
      }
      console.error('Booking error:', err);
      res.status(500).json({ error: err.message || 'Server error' });
    }
  }

  // PAYMENT CALLBACK (from bank)
  static async payCallback(req: Request, res: Response) {
    const { bookingId } = req.body;
    try {
      const cache = await redis.get(`pending:${bookingId}`);
      if (!cache) return res.status(400).json({ error: 'Payment expired or invalid' });

      const { deviceId } = JSON.parse(cache);

      const booking = await models.Booking.findByPk(bookingId);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });

      // Fixed: use booking.roomId, not booking.id
      const room = await models.Room.findByPk(booking.dataValues.roomId);
      if (!room) return res.status(404).json({ error: 'Room not found' });

      await booking.update({ status: 'paid', paidAt: new Date() });

      // Activate power
      if (deviceId) {
        const device = await models.Device.findByPk(deviceId);
        if (device) {
          device.dataValues.status //TODO: extend by exist data here 
          const checkInDate = new Date(booking.dataValues.checkIn);
          const checkOutDate = new Date(booking.dataValues.checkOut);
          const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / 86400000);
          const conditionValue = booking.dataValues.conditionValue || 0;

          if (conditionValue > 0) {
            await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/EnergyReset`, '0');
            const rule = `ON Energy#Total>${(conditionValue / 1000) + (device?.dataValues?.energy || 0)} DO Power${1} OFF ENDON`;
            await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, rule);
            await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '1');

            const newconditionValue = (device.dataValues.energy || 0) + (conditionValue / 1000)
             const updateNewconditionValue = await booking.update({
              conditionValue: newconditionValue
            });
            console.log('updateNewconditionValue', updateNewconditionValue.toJSON());
          }
          if (nights > 0) {
            const minutes = DeviceService.minutesUntilNoonAfterNights(nights);
            const timer = `{"Enable":1,"Mode":0,"Time":"0:${minutes}","Action":0}`;
            await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, timer);
            const newconditionValue = minutes;
             const updateNewconditionValue = await booking.update({
              conditionValue: newconditionValue
            });
            console.log('updateNewconditionValue', updateNewconditionValue.toJSON());

          }
         
          const relay = 1;
          const command = 'ON';
          const mqttTopic = `cmnd/${device.dataValues.tasmotaId}/POWER${relay === 1 ? '' : relay}`;
          console.log(`Sending MQTT command to ${mqttTopic} with payload: ${command}`);
          await publishMqttMessage(mqttTopic, command);
        }
      }

      // Activate lock if exists
      if (room.dataValues.lockId) {
        await activateLock(room.dataValues.lockId);
      }

      await notifyStakeholders(booking, 'Booking paid and activated');

      await redis.del(`pending:${bookingId}`); // clean up


      const token_user = await redis.get(`bookingID_laabxapp:${booking.dataValues.id}`);
      const datanoti = { callback: 'true', booking }
      const noti = await notilaabx_smartcb(datanoti, token_user || '')
      console.log('notilaabx_smartcb000', noti);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // USER: Get my bookings
  static async getMyBookings(req: Request, res: Response) {
    const userUuid = res.locals.user.uuid;

    try {
      const bookings = await models.Booking.findAll({
        where: { userUuid },
        include: [
          {
            model: models.Room,
            as: 'room',
            include: [
              {
                model: models.Location,
                as: 'location'
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      if (bookings.length === 0) {
        return res.json([]);
      }

      // Collect device IDs from included room
      const deviceIds = bookings
        .map(booking => booking.dataValues.room?.deviceId)
        .filter((id): id is number => id !== null && id !== undefined);

      // Fetch all devices in ONE query
      const devicesMap: Record<number, any> = {};
      if (deviceIds.length > 0) {
        const devices = await models.Device.findAll({
          where: { id: deviceIds },
          attributes: ['id', 'tasmotaId', 'name', 'status', 'power', 'energy']
        });

        for (const device of devices) {
          devicesMap[device.dataValues.id] = device.get({ plain: true });
        }
      }

      // Build final response
      const result = bookings.map(booking => {
        const plainBooking = booking.get({ plain: true });

        if (plainBooking.room?.deviceId && devicesMap[plainBooking.room.deviceId]) {
          plainBooking.device = devicesMap[plainBooking.room.deviceId];
        }

        return plainBooking;
      });

      res.json(result);
    } catch (error: any) {
      console.error('getMyBookings error:', error);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  }

  // OWNER: Get all bookings in their hotels
  static async getOwnerBookings(req: Request, res: Response) {
    const userUuid = res.locals.user.uuid;
    const userRole = res.locals.user.role;

    if (userRole !== 'owner') {
      return res.status(403).json({ error: 'Owner access only' });
    }

    const bookings = await models.Booking.findAll({
      include: [{
        model: models.Room,
        as: 'room',
        include: [{
          model: models.Location,
          as: 'location'
        }],
        where: { uuid: userUuid } // assuming rooms have ownerUuid or via location
      }],
      order: [['createdAt', 'DESC']],
    });

    res.json(bookings);
  }

  // ADMIN: Get all bookings (global)
  static async getAllBookings(req: Request, res: Response) {
    const userRole = res.locals.user.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access only' });
    }

    const bookings = await models.Booking.findAll({
      include: [{
        model: models.Room,
        as: 'room',
        include: [{
          model: models.Location,
          as: 'location'
        }]
      }],
      order: [['createdAt', 'DESC']],
    });

    res.json(bookings);
  }

  // ADMIN: Get bookings by location
  static async getBookingsByLocation(req: Request, res: Response) {
    const userRole = res.locals.user.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access only' });
    }

    const { locationid } = req.params;

    const bookings = await models.Booking.findAll({
      include: [{
        model: models.Room,
        as: 'room',
        where: { locationId: locationid },
        include: [{
          model: models.Location,
          as: 'location'
        }]
      }],
      order: [['createdAt', 'DESC']],
    });

    res.json(bookings);
  }

  static async deletebookingsByRoomId(req: Request, res: Response) {
    const { roomId } = req.params;
    const userRole = res.locals.user.role;
    console.log('deletebookingsByRoomId', roomId, userRole);
    if (userRole !== 'owner') {
      return res.status(403).json({ error: 'Owner access only' });
    }
    try {
      await models.Booking.destroy({ where: { roomId } });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }


  // src/controllers/booking.controller.ts — add these

  static async getRoomSummary(req: Request, res: Response) {
    const { roomId } = req.params;
    const { from, to } = req.query;
    const where: any = { roomId, status: 'paid' };
    if (from && to) {
      where.paidAt = { [Op.between]: [new Date(from as string), new Date(to as string)] };
    }

    const total = await models.Booking.sum('totalPrice', { where });
    res.json({ roomId, totalPaid: total || 0 });
  }

  static async getLocationSummary(req: Request, res: Response) {
    const { locationId } = req.params;
    const { from, to } = req.query;
    const where: any = { status: 'paid' };
    if (from && to) {
      where.paidAt = { [Op.between]: [new Date(from as string), new Date(to as string)] };
    }

    const bookings = await models.Booking.findAll({
      where,
      include: [{ model: models.Room, as: 'room', where: { locationId } }]
    });

    const total = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    res.json({ locationId, totalPaid: total });
  }

  static async getTotalSummary(req: Request, res: Response) {
    const { from, to } = req.query;
    const where: any = { status: 'paid' };
    if (from && to) {
      where.paidAt = { [Op.between]: [new Date(from as string), new Date(to as string)] };
    }

    const total = await models.Booking.sum('totalPrice', { where });
    res.json({ totalPaid: total || 0 });
  }
}