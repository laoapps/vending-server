// src/controllers/owner.controller.ts
import { Request, Response } from 'express';
import models from '../models';
import { findPhoneNumberByUuid, findRealDB } from '../services/userManagerService';

export class OwnerController {
  // ADMIN: List all owners (including merchantKey, walletKey)
  static async getAllOwners(req: Request, res: Response) {
    if (res.locals.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    try {
      const owners = await models.Owner.findAll({
        attributes: ['id', 'uuid', 'phoneNumber', 'ownerUuid', 'merchantKey', 'walletKey', 'createdAt'],
        order: [['createdAt', 'DESC']]
      });
      res.json(owners);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create owner from token (admin or auto on first login)
  static async createOwner(req: Request, res: Response) {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    try {
      const uuid = await findRealDB(token);
      const phoneNumber = await findPhoneNumberByUuid(uuid);
      if (!uuid) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const existing = await models.Owner.findOne({ where: { ownerUuid: uuid } });
      if (existing) {
        return res.status(200).json(existing); // already exists
      }

      const owner = await models.Owner.create({
        phoneNumber, // can be updated later
        ownerUuid: uuid
      });

      res.status(201).json(owner);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // ADMIN: Update merchantKey / walletKey
  static async updateOwnerKeys(req: Request, res: Response) {
    if (res.locals.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { id } = req.params;
    const { merchantKey, walletKey } = req.body;

    try {
      const owner = await models.Owner.findByPk(id);
      if (!owner) return res.status(404).json({ error: 'Owner not found' });

      await owner.update({
        merchantKey: merchantKey || owner.dataValues.merchantKey,
        walletKey: walletKey || owner.dataValues.walletKey
      });

      res.json({ success: true, owner });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // OWNER: Get own profile (keys hidden)
  static async getMyProfile(req: Request, res: Response) {
    const userUuid = res.locals.user.uuid;

    try {
      const owner = await models.Owner.findOne({
        where: { ownerUuid: userUuid },
        attributes: ['id', 'uuid', 'phoneNumber', 'ownerUuid', 'createdAt'] // hide keys
      });

      if (!owner) return res.status(404).json({ error: 'Owner profile not found' });

      res.json(owner);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}