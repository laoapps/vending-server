// src/controllers/location.controller.ts
import { Request, Response } from 'express';
import LocationModel from '../models/location.model';
import RoomModel from '../models/room.model';

export class LocationController {
  // PUBLIC: List all hotels
  static async getAll(req: Request, res: Response) {
    try {
      const locations = await LocationModel.findAll({

      });
      res.json(locations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // PUBLIC: Get one hotel
  static async getById(req: Request, res: Response) {
    try {
      const location = await LocationModel.findByPk(req.params.id, {
        // include: [{ model: RoomModel, as: 'rooms' }],
      });
      if (!location) return res.status(404).json({ error: 'Location not found' });
      res.json(location);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // OWNER/ADMIN: Create new hotel
  static async create(req: Request, res: Response) {
    const { name, address, description, photo } = req.body;
    const userRole = res.locals.user.role;

    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Only owner or admin can create locations' });
    }

    try {
      const location = await LocationModel.create({
        name,
        address,
        description,
        photo,
      });
      res.status(200).json(location);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // OWNER/ADMIN: Update hotel
  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name, address, description, photo } = req.body;
    const userRole = res.locals.user.role;

    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const location = await LocationModel.findByPk(id);
      if (!location) return res.status(404).json({ error: 'Location not found' });

      await location.update({ name, address, description, photo });
      res.json(location);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // OWNER/ADMIN: Delete hotel
  static async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userRole = res.locals.user.role;

    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const location = await LocationModel.findByPk(id);
      if (!location) return res.status(404).json({ error: 'Location not found' });

      // Optional: prevent delete if has rooms
      const roomCount = await RoomModel.count({ where: { locationId: id } });
      if (roomCount > 0) {
        return res.status(400).json({ error: 'Cannot delete location with rooms' });
      }

      await location.destroy();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}