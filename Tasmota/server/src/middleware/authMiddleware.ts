import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { findRealDB } from '../services/userManagerService';
import models from '../models';
import redis from '../config/redis';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  const adminKey = req.headers['x-admin-key'];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Check Redis cache
    const cacheKey = `user:${token}`;
    const cachedData = await redis.get(cacheKey);
    let user: { uuid: string; role: string };

    if (cachedData) {
      user = JSON.parse(cachedData);
    } else {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { uuid: string; role: string };
      const validatedUuid = await findRealDB(token);
      if (!validatedUuid || validatedUuid !== decoded.uuid) {
        return res.status(401).json({ error: 'Invalid token or user not found' });
      }

      const owner = await models.Owner.findOne({ where: { uuid: decoded.uuid } });
      let role = owner ? 'owner' : 'user';

      // Admin verification
      if (adminKey === 'super-admin') {
        const admin = await models.Admin.findOne({ where: { uuid: decoded.uuid } });
        if (!admin) {
          await models.Admin.create({ uuid: decoded.uuid, phoneNumber: 'admin-' + decoded.uuid });
        }
        role = 'admin';
      }

      user = { uuid: decoded.uuid, role };
      // Cache for 60 minutes (3600 seconds)
      await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600);
    }

    res.locals.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};