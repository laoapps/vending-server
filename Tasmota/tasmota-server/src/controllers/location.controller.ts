// src/controllers/location.controller.ts
import { Request, Response } from 'express';
import LocationModel from '../models/location.model';
import RoomModel from '../models/room.model';

export class LocationController {
  static async getAll(req: Request, res: Response) {
    try {
      const locations = await LocationModel.findAll({
        include: [{ model: RoomModel, as: 'rooms' }],
      });
      res.json(locations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
  }
}

  static async getById(req: Request, res: Response) {
    try {
      const location = await LocationModel.findByPk(req.params.id, {
        include: [{ model: RoomModel, as: 'rooms' }],
      });
      if (!location) return res.status(404).json({ error: 'Location not found' });
      res.json(location);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}