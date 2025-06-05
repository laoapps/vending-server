import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import models from '../models';
import { findPhoneNumberByUuid, findRealDB } from '../services/userManagerService';
import { env } from '../config/env';

export const registerOwner = async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    const uuid = await findRealDB(token);
    if (!uuid) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const existingOwner = await models.Owner.findOne({ where: { uuid } });
    if (existingOwner) {
      return res.status(400).json({ error: 'Owner already registered' });
    }
    const phoneNumber = await findPhoneNumberByUuid(uuid);
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number not found for this user' });
    }
    const owner = await models.Owner.create({ uuid,phoneNumber });
    const jwtToken = jwt.sign({ uuid, role: 'owner' }, env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token: jwtToken, role: 'owner', owner });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Registration failed' });
  }
};

export const getUserRole = async (req: Request, res: Response) => {
  const user = res.locals.user;

  try {
    res.json({ role: user.role });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch user role' });
  }
};