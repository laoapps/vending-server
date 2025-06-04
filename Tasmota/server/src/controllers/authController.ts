import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import models from '../models';
import { findUuidByPhoneNumberOnUserManager } from '../services/userManagerService';
import { env } from '../config/env';

export const login = async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;

  try {
    const userData = await findUuidByPhoneNumberOnUserManager(phoneNumber);
    if (!userData) {
      return res.status(401).json({ error: 'Invalid phone number' });
    }

    const owner = await models.Owner.findOne({ where: { uuid: userData.uuid } });
    const admin = await models.Admin.findOne({ where: { uuid: userData.uuid } });

    const role = admin ? 'admin' : owner ? 'owner' : 'user';
    const token = jwt.sign({ uuid: userData.uuid, role }, env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, role });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Login failed' });
  }
};

export const registerOwner = async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;

  try {
    const userData = await findUuidByPhoneNumberOnUserManager(phoneNumber);
    if (!userData) {
      return res.status(401).json({ error: 'Invalid phone number' });
    }

    const existingOwner = await models.Owner.findOne({ where: { uuid: userData.uuid } });
    if (existingOwner) {
      return res.status(400).json({ error: 'Owner already registered' });
    }

    const owner = await models.Owner.create({
      uuid: userData.uuid,
      phoneNumber,
    });

    const token = jwt.sign({ uuid: userData.uuid, role: 'owner' }, env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, owner });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Registration failed' });
  }
};