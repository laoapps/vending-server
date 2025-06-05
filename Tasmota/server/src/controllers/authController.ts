import { Request, Response } from 'express';

import models from '../models';
import { findPhoneNumberByUuid, findRealDB } from '../services/userManagerService';


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
      return res.status(401).json({ error: 'Phone number not found for user' });
    }

    const owner = await models.Owner.create({ uuid,phoneNumber });
    res.json({ owner });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Registration failed' });
  }
};