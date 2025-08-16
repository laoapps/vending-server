import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { findPhoneNumberByUuid, findRealDB } from '../services/userManagerService';
import models from '../models';
import redis from '../config/redis';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  const adminKey = req.headers['x-admin-key'];
  // const isOwnerFunction = req.headers['x-owner'] === 'true';
  const isOwnerFunction = String(req.headers['x-owner']).toLowerCase() === "true";
  console.log('isOwnerFunction',isOwnerFunction, typeof(isOwnerFunction), req.headers['x-owner'], typeof(req.headers['x-owner']));
  
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

      const validatedUuid = await findRealDB(token);
      if (!validatedUuid) {
        return res.status(401).json({ error: 'Invalid token or user not found' });
      }

      const owner =  (await models.Owner.findOne({ where: { uuid: validatedUuid } }));

      let role = owner ? 'owner' : 'user';
      if(!isOwnerFunction){
        role = 'user';
      }
      // Admin verification
      if (adminKey === 'super-admin') {
        const admin = await models.Admin.findOne({ where: { uuid: validatedUuid } });
        if (!admin) {
              const phoneNumber = await findPhoneNumberByUuid(validatedUuid);
              console.log('Found phone number for UUID:', validatedUuid, 'Phone Number:', phoneNumber);
              if (!phoneNumber) {
                return res.status(400).json({ error: 'Phone number not found for this user' });
              }
          await models.Admin.create({ uuid: validatedUuid, phoneNumber } as any);
        }
        role = 'admin';
      }

      user = { uuid:validatedUuid, role };
      // Cache for 60 minutes (3600 seconds)
      await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600);
    }

    res.locals.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};