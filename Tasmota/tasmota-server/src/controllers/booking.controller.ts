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

export class BookingController {
  // USER: Create booking
  static async create(req: Request, res: Response) {
    const userUuid = res.locals.user.uuid;
    let { roomId, checkIn, checkOut, guests = 1 } = req.body;

    try {
      const room = await models.Room.findByPk(roomId);
      if (!room) return res.status(404).json({ error: 'Room not found' });
      if (!room.dataValues.capacity) return res.status(400).json({ error: 'Room unavailable' });

      let totalPrice = 0;
      let mode: 'hotel' | 'condo' | 'package' = 'hotel';

      // Mode 1: Hotel by nights
      if (room?.dataValues?.roomType === 'time_only' && checkIn && checkOut) {
        mode = 'hotel';
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

      // // Mode 2: Condo by kWh
      // else if (conditionType === 'energy_consumption') {
      //   mode = 'condo';
      //   if (conditionValue <= 0) return res.status(400).json({ error: 'Invalid kWh' });
      //   totalPrice = room.price * conditionValue;  // price per kWh
      // }

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
      const qrData = await generateQR(booking.id, totalPrice, res.locals.user.token);

      // Cache for payment
      await redis.set(`pending:${booking.id}`, JSON.stringify({ mode, deviceId: room.deviceId }), 'EX', 1800);

      res.json({ booking, qrCode: qrData.qrImage, totalPrice });
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

      await models.Booking.update({ status: 'paid', paidAt: new Date() }, { where: { id: bookingId } });

      // Activate device
      const device = await models.Device.findByPk(deviceId);
      if (device) publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/POWER`, 'ON');

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