// src/controllers/location.controller.ts
import { Request, Response } from 'express';
import LocationModel from '../models/location.model';
import RoomModel from '../models/room.model';
import models from '../models';

export class LocationController {
  // GET /api/locations — admin sees all, owner sees only own
  static async getAll(req: Request, res: Response) {
    const userRole = res.locals.user.role;
    const userUuid = res.locals.user.uuid;

    try {
      let locations;
      if (userRole === 'admin') {
        locations = await LocationModel.findAll({
          order: [['createdAt', 'DESC']]
        });
      } else if (userRole === 'owner') {
        const owner = await models.Owner.findOne({ where: { uuid: userUuid } });
        if (!owner) return res.status(404).json({ error: 'Owner not found' });

        locations = await LocationModel.findAll({
          where: { ownerId: owner.dataValues.id },
          order: [['createdAt', 'DESC']]
        });
      } else {
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.json(locations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/locations/:id
  static async getById(req: Request, res: Response) {
    try {
      const location = await LocationModel.findByPk(req.params.id);
      if (!location) return res.status(404).json({ error: 'Location not found' });
      res.json(location);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/locations — admin only
  static async create(req: Request, res: Response) {
    if (res.locals.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { name, address, description = {}, photo = [], locationType = 'hotel', ownerId } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address required' });
    }

    try {
      const location = await LocationModel.create({
        name,
        address,
        description,
        photo, // JSONB array
        locationType,
        ownerId: ownerId || null
      });
      res.status(201).json(location);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // PUT /api/locations/:id — admin only
  static async update(req: Request, res: Response) {
    if (res.locals.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { id } = req.params;
    const updates = req.body;

    try {
      const location = await LocationModel.findByPk(id);
      if (!location) return res.status(404).json({ error: 'Location not found' });

      await location.update(updates);
      res.json(location);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // DELETE /api/locations/:id — admin only
  static async delete(req: Request, res: Response) {
    if (res.locals.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { id } = req.params;
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

  // PATCH /api/locations/:id/assign-owner — admin only
  static async assignOwner(req: Request, res: Response) {
    if (res.locals.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { id } = req.params;
    const { ownerId } = req.body;

    if (!ownerId) {
      return res.status(400).json({ error: 'ownerId required' });
    }

    try {
      const location = await LocationModel.findByPk(id);
      if (!location) return res.status(404).json({ error: 'Location not found' });

      const owner = await models.Owner.findByPk(ownerId);
      if (!owner) return res.status(404).json({ error: 'Owner not found' });

      await location.update({ ownerId });
      res.json({ success: true, location });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}