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

export class BookingController {
  // USER: Create booking
  static async create(req: Request, res: Response) {
    const userUuid = res.locals.user.uuid;
    let { roomId, checkIn, checkOut, guests = 1, totalKwh } = req.body;

    try {
      const room = await models.Room.findByPk(roomId);
      if (!room) return res.status(404).json({ error: 'Room not found' });
      if (!room.dataValues.capacity) return res.status(400).json({ error: 'Room unavailable' });
      room.locationId;
      const location = await models.Location.findByPk(room.locationId);
      if (!location) return res.status(400).json({ error: 'location not found' });

      let totalPrice = 0;
      let mode = location.dataValues.locationType || 'hotel';

      // Mode 1: Hotel by nights
      if (room?.dataValues?.roomType === 'time_only' && checkIn && checkOut) {
        mode = 'hotel';
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        if (nights <= 0) return res.status(400).json({ error: 'Invalid dates' });
        totalPrice = room?.dataValues?.price * nights;

        // Check availability
        const now = new Date();
        const holdMinutes = 3; // Change to 5 or 15 if you want
        const holdTime = new Date(now.getTime() - holdMinutes * 60 * 1000);

        const conflicting = await models.Booking.findOne({
          where: {
            roomId,
            status: { [Op.notIn]: ['cancelled', 'checked_out'] }, // exclude finished
            // Exclude old pending bookings (older than hold time)
            [Op.or]: [
              // Active paid bookings OR recent pending
              {
                status: 'paid',
                [Op.or]: [
                  { checkIn: { [Op.lt]: checkOutDate } },
                  { checkOut: { [Op.gt]: checkInDate } }
                ]
              },
              {
                status: 'pending',
                createdAt: { [Op.gte]: holdTime }, // only recent pending
                [Op.or]: [
                  { checkIn: { [Op.lt]: checkOutDate } },
                  { checkOut: { [Op.gt]: checkInDate } }
                ]
              }
            ]
          }
        });

        if (conflicting) {
          return res.status(400).json({
            error: `Room unavailable. Currently held by another user (expires in ${holdMinutes} minutes if not paid).`
          });
        }
      }

      // // Mode 2: Condo by kWh
      else if (room?.dataValues?.roomType === 'kwh_only' && totalKwh) {
        mode = 'condo';

        if (checkIn && checkOut) {
          const checkInDate = new Date(checkIn);
          const checkOutDate = new Date(checkOut);
          const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
          if (nights <= 0) return res.status(400).json({ error: 'Invalid dates' });
          totalPrice = room?.dataValues?.price * nights;

          // Check availability
          const conflicting = await models.Booking.findOne({
            where: {
              roomId,
              status: { [Op.notIn]: ['cancelled', 'checked_out'] },
              [Op.or]: [
                { checkIn: { [Op.lt]: checkOutDate }, checkOut: { [Op.gt]: checkInDate } }
              ]
            }
          });
          console.log('conflicting', conflicting);

          if (conflicting) return res.status(400).json({ error: 'Dates unavailable' });
        }

        ////

        if (totalKwh <= 0) return res.status(400).json({ error: 'Invalid kWh' });
        totalPrice += room.price * totalKwh;  // price per kWh
      }

      // // Mode 3: Package
      // else if (packageId) {
      //   mode = 'package';
      //   const pkg = await models.SchedulePackage.findByPk(packageId);
      //   if (!pkg) return res.status(404).json({ error: 'Package not found' });
      //   totalPrice = pkg.dataValues.price;
      //   conditionType = pkg.dataValues.conditionType;
      //   conditionValue = pkg.dataValues.conditionValue;
      // }

      else {
        return res.status(400).json({ error: 'Invalid booking mode' });
      }

      // Create booking
      const booking = await models.Booking.create({
        roomId,
        userUuid,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        guests,
        totalPrice,
        status: 'pending',
      });

      // Generate QR
      const token = req.headers.authorization?.split(' ')[1];
      const qrData = await generateQR(booking.dataValues.id, totalPrice, token || '', false, true);

      // Cache for payment
      await redis.set(`pending:${booking.dataValues.id}`, JSON.stringify({ mode, deviceId: room.deviceId }), 'EX', 1800);

      // res.json({ qr, data: { order } });
      // res.json({ booking, qrCode: qrData.qrImage, totalPrice });
      res.json({ booking, qrCode: qrData, totalPrice });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // PAYMENT CALLBACK (from bank)
  static async payCallback(req: Request, res: Response) {
    const { bookingId } = req.body;
    try {
      const cache = await redis.get(`pending:${bookingId}`);
      if (!cache) return res.status(400).json({ error: 'Expired' });
      const { mode, deviceId } = JSON.parse(cache);

      const booking = await models.Booking.findByPk(bookingId);
      if (!booking) return res.status(400).json({ error: 'Booking not found' });
      const room = await models.Room.findByPk(booking.dataValues.id,);
      if (!room) return res.status(400).json({ error: 'Room not found' });

      await models.Booking.update(
        { status: 'paid', paidAt: new Date() },
        { where: { id: bookingId } }
      );

      // Activate power device (existing)
      if (deviceId) {
        const device = await models.Device.findByPk(deviceId);
        if (device) publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/POWER`, 'ON');
      }

      // NEW: Activate door lock if room has lockId
      if (room.dataValues.lockId) {
        await activateLock(room.dataValues.lockId);
      }

      notifyStakeholders(undefined, `Booking ${mode} paid`);

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
      //   include: [{
      //     model: RoomModel,
      //     include: ['location']
      //   }],
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
      //   include: [{
      //     model: RoomModel,
      //     include: ['location'],
      //     where: { ownerUuid: userUuid } // assuming rooms have ownerUuid or via location
      //   }],
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
      //   include: [{
      //     model: RoomModel,
      //     include: ['location']
      //   }],
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
      //   include: [{
      //     model: RoomModel,
      //     where: { locationId: locationid },
      //     // include: ['location']
      //   }],
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
}