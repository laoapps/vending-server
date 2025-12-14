// src/controllers/booking.controller.ts
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import BookingModel from '../models/booking.model';
import RoomModel from '../models/room.model';
import { Device } from '../models/device';
import { generateQR } from '../services/lakService';
import { publishMqttMessage } from '../services/mqttService';
import redis from '../config/redis';
import models from '../models';
import { notifyStakeholders } from '../services/wsService';
import { activateLock } from '../services/lockService';
import sequelize from 'sequelize';

export class BookingController {
  // USER: Create booking
  static async create(req: Request, res: Response) {
  const userUuid = res.locals.user.uuid;
  const { roomId, checkIn, checkOut, guests = 1, kwhAmount } = req.body; // renamed

  try {
    const room = await models.Room.findByPk(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const location = await models.Location.findByPk(room.locationId);
    if (!location) return res.status(400).json({ error: 'Location not found' });

    let totalPrice = 0;
    let checkInDate: Date | null = null;
    let checkOutDate: Date | null = null;

    // === HOTEL MODE ===
    if (room.dataValues.roomType === 'time_only' || room.dataValues.roomType === 'both') {
      if (!checkIn || !checkOut) {
        return res.status(400).json({ error: 'checkIn and checkOut required for hotel booking' });
      }

      checkInDate = new Date(checkIn);
      checkOutDate = new Date(checkOut);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      if (nights <= 0) return res.status(400).json({ error: 'Invalid dates' });

      totalPrice = room.dataValues.price * nights * guests;
    }

    // === CONDO MODE ===
    else if (room.dataValues.roomType === 'kwh_only' || room.dataValues.roomType === 'both') {
      if (!kwhAmount || kwhAmount <= 0) {
        return res.status(400).json({ error: 'Valid kWh amount required' });
      }

      totalPrice = room.dataValues.price * kwhAmount;

      // Optional dates for condo (for reporting)
      if (checkIn && checkOut) {
        checkInDate = new Date(checkIn);
        checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        if (nights <= 0) return res.status(400).json({ error: 'Invalid dates' });
      }
    }

    else {
      return res.status(400).json({ error: 'Unsupported room type' });
    }

    // === COMMON OVERLAP + HOLD TIME CHECK ===
    if (checkInDate && checkOutDate) {
      const now = new Date();
      const holdMinutes = 3;
      const holdTime = new Date(now.getTime() - holdMinutes * 60 * 1000);

      const conflicting = await models.Booking.findOne({
        where: {
          roomId,
          status: { [Op.notIn]: ['cancelled', 'checked_out'] },
          [Op.or]: [
            // Paid → always block
            {
              status: 'paid',
              [Op.or]: [
                { checkIn: { [Op.lt]: checkOutDate } },
                { checkOut: { [Op.gt]: checkInDate } }
              ]
            },
            // Pending → only if recent AND overlaps
            {
              status: 'pending',
              createdAt: { [Op.gte]: holdTime },
              [Op.or]: [
                { checkIn: { [Op.lt]: checkOutDate } },
                { checkOut: { [Op.gt]: checkInDate } }
              ]
            }
          ]
        }
      });

      if (conflicting) {
        if (conflicting.status === 'paid') {
          return res.status(400).json({ error: 'Room already booked for these dates' });
        } else {
          return res.status(400).json({
            error: `Room temporarily held by another user. Try again in ${holdMinutes} minutes or choose different dates.`
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
      status: 'pending',
    });

    // Generate QR
    const token = req.headers.authorization?.split(' ')[1] || '';
    const qrData = await generateQR(booking.dataValues.id, totalPrice, token, false, true);

    // Cache for payment callback
    await redis.set(`pending:${booking.dataValues.id}`, JSON.stringify({
      mode: room.dataValues.roomType.includes('time') ? 'hotel' : 'condo',
      deviceId: room.dataValues.deviceId
    }), 'EX', 1800);

    res.json({
      booking,
      qrCode: qrData,
      totalPrice
    });

  } catch (error: any) {
    console.error('Booking create error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
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
        await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/POWER`, 'ON');
      }
    }

    // Activate lock if exists
    if (room.lockId) {
      await activateLock(room.dataValues.lockId);
    }

    await notifyStakeholders(booking, 'Booking paid and activated');

    await redis.del(`pending:${bookingId}`); // clean up

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

  // USER: Get my bookings
  static async getMyBookings(req: Request, res: Response) {
    const userUuid = res.locals.user.uuid;

    const bookings = await BookingModel.findAll({
      where: { userUuid },
      include: [{
        model: RoomModel,
        include: ['location']
      }],
      order: [['createdAt', 'DESC']],
    });

    // Add device info manually
    const result = await Promise.all(
      bookings.map(async (b: any) => {
        if (b.room?.deviceId) {
          const device = await Device.findByPk(b.room.deviceId);
          b.dataValues.device = device;
        }
        return b;
      })
    );

    res.json(result);
  }

  // OWNER: Get all bookings in their hotels
  static async getOwnerBookings(req: Request, res: Response) {
    const userUuid = res.locals.user.uuid;
    const userRole = res.locals.user.role;

    if (userRole !== 'owner') {
      return res.status(403).json({ error: 'Owner access only' });
    }

    const bookings = await BookingModel.findAll({
      include: [{
        model: RoomModel,
        include: ['location'],
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

    const bookings = await BookingModel.findAll({
      include: [{
        model: RoomModel,
        include: ['location']
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

    const bookings = await BookingModel.findAll({
      include: [{
        model: RoomModel,
        where: { locationId: locationid },
        include: ['location']
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
      await BookingModel.destroy({ where: { roomId } });
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
      include: [{ model: models.Room, where: { locationId } }]
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