import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { findUuidByPhoneNumberOnUserManager } from '../services/userManagerService';
import models from '../models';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { uuid: string; role: string };
    const userData = await findUuidByPhoneNumberOnUserManager(decoded.uuid);
    if (!userData || userData.uuid !== decoded.uuid) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    const owner = await models.Owner.findOne({ where: { uuid: decoded.uuid } });
    const admin = await models.Admin.findOne({ where: { uuid: decoded.uuid } });
    res.locals.user = { uuid: decoded.uuid, role: admin ? 'admin' : owner ? 'owner' : 'user' };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};