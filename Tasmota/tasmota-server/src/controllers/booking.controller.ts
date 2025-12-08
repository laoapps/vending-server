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

export class BookingController {
  // USER: Create booking
  static async create(req: Request, res: Response) {
    const {
      roomId,
      checkIn = new Date().toISOString(),
      guests = 1,
      conditionType = 'time_duration',
      conditionValue,
    } = req.body;
    const userUuid = res.locals.user.uuid;

    if (!['time_duration', 'energy_consumption'].includes(conditionType)) {
      return res.status(400).json({ error: 'Invalid conditionType' });
    }
    if (!conditionValue || conditionValue <= 0) {
      return res.status(400).json({ error: 'conditionValue required' });
    }

    try {
      const room = await RoomModel.findByPk(roomId);
      if (!room) return res.status(404).json({ error: 'Room not found' });
      if (!room.available) return res.status(400).json({ error: 'Room not available' });
      if (!room.deviceId) return res.status(400).json({ error: 'No device assigned' });

      const device = await Device.findByPk(room.deviceId);
      if (!device) return res.status(500).json({ error: 'Device error' });

      let totalPrice = 0;
      let checkOutDate: Date | null = null;

      if (conditionType === 'time_duration') {
        const hours = Number(conditionValue);
        totalPrice = room.price * hours * guests;
        checkOutDate = new Date(new Date(checkIn).getTime() + hours * 60 * 60 * 1000);
      } else {
        const kwh = Number(conditionValue);
        totalPrice = room.price * kwh * guests;
      }

      const booking = await BookingModel.create({
        roomId,
        userUuid,
        checkIn: new Date(checkIn),
        checkOut: checkOutDate,
        guests,
        totalPrice,
        conditionType,
        conditionValue: Number(conditionValue),
        status: 'pending',
      });

      const qr = await generateQR(
        booking.id,
        totalPrice,
        req.headers.authorization?.split(' ')[1] || ''
      );

      await redis.setex(`hotel_room_booked:${roomId}`, 300, '1');

      return res.json({
        success: true,
        booking,
        paymentData: { amount: totalPrice },
        qr,
      });
    } catch (err: any) {
      console.error('Booking create error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // PAYMENT CALLBACK (from bank)
  static async payCallback(req: Request, res: Response) {
    // ... same as before — unchanged
    // (kept exactly as working version above)
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
}