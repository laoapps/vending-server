// src/controllers/location.controller.ts
import { Request, Response } from 'express';
import LocationModel from '../models/location.model';
import RoomModel from '../models/room.model';

export class LocationController {
  // PUBLIC: List all locations (filter by type: ?locationType=hotel or condo)
  static async getAll(req: Request, res: Response) {
    try {
      const { locationType } = req.query;

      let locations;
      if (locationType && ['hotel', 'condo'].includes(locationType as string)) {
        locations = await LocationModel.findAll({
          where: { locationType }
        });
      } else {
        locations = await LocationModel.findAll();
      }

      res.json(locations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // PUBLIC: Get one location
  static async getById(req: Request, res: Response) {
    try {
      const location = await LocationModel.findByPk(req.params.id);
      if (!location) return res.status(404).json({ error: 'Location not found' });
      res.json(location);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // OWNER/ADMIN: Create new location
  static async create(req: Request, res: Response) {
    const { name, address, description = {}, photo, locationType = 'hotel' } = req.body;
    const userRole = res.locals.user.role;

    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Only owner or admin can create locations' });
    }

    if (!['hotel', 'condo'].includes(locationType)) {
      return res.status(400).json({ error: 'locationType must be hotel or condo' });
    }

    try {
      const location = await LocationModel.create({
        name,
        address,
        description: description, // JSONB
        photo,
        locationType
      });
      res.json(location);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // OWNER/ADMIN: Update location
  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name, address, description = {}, photo, locationType } = req.body;
    const userRole = res.locals.user.role;

    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const location = await LocationModel.findByPk(id);
      if (!location) return res.status(404).json({ error: 'Location not found' });

      const updateData: any = { name, address, description, photo };
      if (locationType) {
        if (!['hotel', 'condo'].includes(locationType)) {
          return res.status(400).json({ error: 'locationType must be hotel or condo' });
        }
        updateData.locationType = locationType;
      }

      await location.update(updateData);
      res.json(location);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // OWNER/ADMIN: Delete location
  static async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userRole = res.locals.user.role;

    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const location = await LocationModel.findByPk(id);
      if (!location) return res.status(404).json({ error: 'Location not found' });

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