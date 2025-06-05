import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { findPhoneNumberByUuid, findRealDB } from '../services/userManagerService';
import models from '../models';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  const adminKey = req.headers['x-admin-key'];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const validatedUuid = await findRealDB(token);
    if (!validatedUuid ) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    const owner = await models.Owner.findOne({ where: { uuid: validatedUuid } });
    let role = owner ? 'owner' : 'user';

    // Admin verification
    if (adminKey === 'super-admin') {
      const admin = await models.Admin.findOne({ where: { uuid:validatedUuid } });
      const phoneNumber = await findPhoneNumberByUuid(validatedUuid);
      if (!phoneNumber) {
        return res.status(401).json({ error: 'Phone number not found for user' });
      }
      if (!admin) {
        await models.Admin.create({ uuid:validatedUuid, phoneNumber });
      }
      role = 'admin';
    }

    res.locals.user = { uuid: validatedUuid, role };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};