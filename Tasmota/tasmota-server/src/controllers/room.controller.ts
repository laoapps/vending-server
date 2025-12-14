// src/controllers/room.controller.ts
import { Request, Response } from 'express';
import RoomModel from '../models/room.model';
import LocationModel from '../models/location.model';
import { Device } from '../models/device';
import { Op } from 'sequelize';
import BookingModel from '../models/booking.model';
import models from '../models';

export class RoomController {
  static async getMyRooms(req: Request, res: Response) {
    const owner = await models.Owner.findOne({ where: { uuid: res.locals.user.uuid } });
    if (!owner) return res.status(403).json({ error: 'Not owner' });

    const rooms = await models.Room.findAll({
      include: [{ model: models.Location , as :'location', attributes: ['name'] }],
      where: { ownerId: owner.dataValues.id }
    });
    res.json(rooms);
  }

  static async updateRoomType(req: Request, res: Response) {
    const { id } = req.params;
    const { roomType, price } = req.body; // roomType: 'time_only' | 'kwh_only' | 'both' | 'package_only'

    const owner = await models.Owner.findOne({ where: { uuid: res.locals.user.uuid } });
    if (!owner) return res.status(403).json({ error: 'Not owner' });

    const room = await models.Room.findOne({ where: { id, ownerId: owner.dataValues.id } });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    await room.update({ roomType, price });
    res.json({ success: true, room });
  }
  // PUBLIC
  static async getByLocation(req: Request, res: Response) {
    try {
      const rooms = await RoomModel.findAll({
        where: { locationId: req.params.locationId },
        include: [{ model: LocationModel, as: 'location' }],
      });
      res.json(rooms);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const room = await RoomModel.findByPk(req.params.id, {
        include: [{ model: LocationModel, as: 'location' }],
      });
      if (!room) return res.status(404).json({ error: 'Room not found' });
      res.json(room);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // OWNER ONLY
  static async getOwnerRooms(req: Request, res: Response) {
    const userRole = res.locals.user.role;
    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const rooms = await RoomModel.findAll({
      include: [
        { model: LocationModel, as: 'location' },
        { model: Device, as: 'device' }
      ],
    });
    res.json(rooms);
  }

  static async create(req: Request, res: Response) {
    const userRole = res.locals.user.role;
    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { locationId, name, price, details, photo, deviceId, roomType, capacity, lockId } = req.body;

    try {
      if (deviceId) {
        const used = await RoomModel.findOne({ where: { deviceId } });
        if (used) return res.status(400).json({ error: 'Room already assigned' });
      }
      const location = await models.Location.findByPk(locationId);
      if (!location) return res.status(404).json({ error: 'Location not found' });

      // Enforce match
      const allowedRoomType = location.dataValues.locationType === 'hotel' ? 'time_only' : 'kwh_only';
      if (roomType && roomType !== allowedRoomType) {
        return res.status(400).json({
          error: `This location is ${location.dataValues.locationType}. Room type must be ${allowedRoomType}`
        });
      }

      const finalRoomType = roomType || allowedRoomType;
      const room = await RoomModel.create({
        locationId,
        name,
        price,
        details,
        photo,
        deviceId: deviceId || null,
        roomType:finalRoomType,
        capacity,
        lockId
      });

      res.status(200).json(room);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }


  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name, price, details, photo, deviceId, roomType, capacity } = req.body;
    const userRole = res.locals.user.role;

    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const room = await RoomModel.findByPk(id);
      if (!room) return res.status(404).json({ error: 'Room not found' });

      if (deviceId && deviceId !== room.deviceId) {
        const used = await RoomModel.findOne({
          where: { deviceId, id: { [Op.ne]: id } }
        });
        if (used) return res.status(400).json({ error: 'Device already used' });
      }

       const location = await models.Location.findByPk(room.dataValues.locationId);
      if (!location) return res.status(404).json({ error: 'Location not found' });

      // Enforce match
      const allowedRoomType = location.dataValues.locationType === 'hotel' ? 'time_only' : 'kwh_only';
      if (roomType && roomType !== allowedRoomType) {
        return res.status(400).json({
          error: `This location is ${location.dataValues.locationType}. Room type must be ${allowedRoomType}`
        });
      }

      const finalRoomType = roomType || allowedRoomType;
      await room.update({ name, price, details, photo, deviceId, roomType:finalRoomType, capacity });
      res.json(room);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userRole = res.locals.user.role;

    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const room = await RoomModel.findByPk(id);
      if (!room) return res.status(404).json({ error: 'Room not found' });

      // Prevent delete if has active booking
      const activeBooking = await BookingModel.findOne({
        where: { roomId: id, status: { [Op.in]: ['pending', 'paid'] } }
      });
      if (activeBooking) {
        return res.status(400).json({ error: 'Cannot delete room with active booking' });
      }

      await room.destroy();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Owner: Assign device
  static async assignDeviceToRoom(req: Request, res: Response) {
    const { roomId, deviceId } = req.body;
    const userRole = res.locals.user.role;

    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const room = await RoomModel.findByPk(roomId);
      if (!room) return res.status(404).json({ error: 'Room not found' });

      if (deviceId) {
        const used = await RoomModel.findOne({
          where: { deviceId, id: { [Op.ne]: roomId } }
        });
        if (used) return res.status(400).json({ error: 'Device already assigned' });
      }

      await room.update({ deviceId });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }


  static async getOwnerLocations(req: Request, res: Response) {
    if (res.locals.user.role !== 'owner') {
      return res.status(403).json({ error: 'Owner only' });
    }

    try {
      const owner = await models.Owner.findOne({ where: { uuid: res.locals.user.uuid } });
      if (!owner) return res.status(404).json({ error: 'Owner not found' });

      const locations = await models.Location.findAll({
        where: { ownerId: owner.dataValues.id },
        include: [{ model: models.Room, as: 'rooms' }]
      });

      res.json(locations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}