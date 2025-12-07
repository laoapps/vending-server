// src/controllers/booking.controller.ts
import { Request, Response } from 'express';
import BookingModel from '../models/booking.model';
import RoomModel from '../models/room.model';
import { Device } from '../models/device';
import { generateQR } from '../services/lakService';
import { publishMqttMessage } from '../services/mqttService';
import redis from '../config/redis';

export class BookingController {
  static async create(req: Request, res: Response) {
    const {
      roomId,
      checkIn,
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
      // 1. Get room
      const room = await RoomModel.findByPk(roomId);
      if (!room) return res.status(404).json({ error: 'Room not found' });
      if (!room.available) return res.status(400).json({ error: 'Room not available' });
      if (!room.deviceId) return res.status(400).json({ error: 'No device assigned' });

      // 2. Get device manually
      const device = await Device.findByPk(room.deviceId);
      if (!device) return res.status(500).json({ error: 'Device not found in DB' });

      // 3. Calculate price & checkout
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

      // 4. Create booking
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

      // 5. Generate QR
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
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // PAYMENT CALLBACK
  static async payCallback(req: Request, res: Response) {
    const { bookingId } = req.body;

    try {
      const booking = await BookingModel.findByPk(bookingId);
      if (!booking || booking.status !== 'pending') {
        return res.status(400).json({ error: 'Invalid booking' });
      }

      const room = await RoomModel.findByPk(booking.roomId);
      if (!room || !room.deviceId) {
        return res.status(500).json({ error: 'Room/device error' });
      }

      const device = await Device.findByPk(room.deviceId);
      if (!device) {
        return res.status(500).json({ error: 'Device not found' });
      }

      // Mark paid
      await booking.update({ status: 'paid', paidAt: new Date() });

      // Update room
      await room.update({
        available: false,
        hotelCheckIn: booking.checkIn,
        hotelCheckOut: booking.checkOut || new Date(Date.now() + 86400000),
      });

      // Clear old rules
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '');
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, '');

      // Apply time or kWh rule
      if (booking.dataValues.conditionType === 'time_duration') {
        const minutes = Math.ceil(booking.dataValues.conditionValue * 60);
        const timer = `{"Enable":1,"Mode":0,"Time":"0:${minutes}","Action":0}`;
        await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, timer);
      } else {
        await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/EnergyReset`, '0');
        const target = (device.dataValues.energy || 0) + (booking.dataValues.conditionValue / 1000);
        const rule = `ON Energy#Total>${target} DO Power1 OFF ENDON`;
        await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, rule);
        await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '1');
      }

      // Turn ON
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/POWER1`, 'ON');

      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Payment failed' });
    }
  }

  // GET MY BOOKINGS
  static async getMyBookings(req: Request, res: Response) {
    const userUuid = res.locals.user.uuid;

    try {
      const bookings = await BookingModel.findAll({
        where: { userUuid },
        include: [RoomModel], // only room, no nested device
        order: [['createdAt', 'DESC']],
      });

      // Add device info manually if needed
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
    } catch (err) {
      res.status(500).json({ error: 'Load failed' });
    }
  }
}