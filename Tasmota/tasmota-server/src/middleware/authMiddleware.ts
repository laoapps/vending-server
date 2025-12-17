import { Request, Response, NextFunction } from 'express';
import { findPhoneNumberByUuid, findRealDB, validateHMVending } from '../services/userManagerService';
import models from '../models';
import redis from '../config/redis';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  const adminKey = req.headers['X-Admin-Key'];
  const isOwnerFunction = req.headers['X-Owner'] === 'true';
  console.log('isOwnerFunction', isOwnerFunction, typeof (isOwnerFunction), req.headers['x-owner'], typeof (req.headers['x-owner']));
  console.log('isadmin_adminKey',adminKey);
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Check Redis cache
    const cacheKey = `user:${token}`;
    // const cachedData = await redis.get(cacheKey);
    const cachedData = false
    let user: { uuid: string; role: string,token:string };

    if (cachedData && isOwnerFunction && JSON.parse(cachedData)?.role == 'owner') {
      console.log('bbjkjkjusttest1');
      
      user = JSON.parse(cachedData);
    }else if(cachedData && !isOwnerFunction){
      console.log('bbjkjkjusttest2');

      user = JSON.parse(cachedData);
      user.role = 'user'
    } else {
      console.log('bbjkjkjusttest3');


      const validatedUuid = await findRealDB(token);
      if (!validatedUuid) {
        return res.status(401).json({ error: 'Invalid token or user not found' });
      }

      console.log('bbjkjkjusttes4');

      const owner = await models.Owner.findOne({ where: { uuid: validatedUuid } });
      console.log('owner444444444', owner, isOwnerFunction);

      let role = owner ? 'owner' : 'user';

      console.log('bbjusttest5');

      if (!isOwnerFunction) {
        role = 'user';
      }
      // Admin verification
      if (adminKey === 'super-admin') {
  console.log('isadmin_adminKey2',adminKey);

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

  console.log('isadmin_adminKey3',role);

      }

      console.log('bbjkjkjusttest6');


      user = { uuid: validatedUuid, role,token };
      // Cache for 60 minutes (3600 seconds)
      await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600);
    }

      console.log('bbjkjkjusttest7');

    res.locals.user = user;
    next();
  } catch (error) {
      console.log('bbjkjkjusttestERROR');

    res.status(401).json({ error: 'authMiddleware Invalid token',err:error });
  }
};

export const authHMVending = async (req: Request, res: Response, next: NextFunction) => {

  const token = req.headers['token'];
  // const machineId = req.headers['machineid'];
  // const otp = req.headers['otp'];
  // console.log('authHMVending',machineId,otp);
  console.log('authHMVending', token);

  if (!token) {
    res.status(401).json({ error: 'Invalid parameters' });
    return;
  }
  // if (!machineId || !otp) {
  //   res.status(401).json({ error: 'Invalid parameters' });
  //   return;
  // }
  // const ownerUuid = await validateHMVending(machineId + '', otp + '');
  const ownerUuid = await validateHMVending(token + '');

  if (!ownerUuid) {
    res.status(401).json({ error: 'Invalid onwerUuid' });
    return;
  }
  try {
    // Check Redis cache
    const cacheKey = `owner:${ownerUuid}`;
    const cachedData = await redis.get(cacheKey);
    let user: { uuid: string; role: string };

    if (cachedData) {
      user = JSON.parse(cachedData);
    } else {

      const phoneNumber = await findPhoneNumberByUuid(ownerUuid);
      if (!phoneNumber) {
        res.status(401).json({ error: 'Invalid ownerUuid or user not found' });
        return;
      }

      const owner = (await models.Owner.findOne({ where: { uuid: ownerUuid } }));
      console.log('owner', owner);
      if (!owner) {
        res.status(401).json({ error: ' owner not found' });

        return;
      }
      let role = 'owner';
      // Admin verification
      user = { uuid: ownerUuid, role };
      // Cache for 60 minutes (3600 seconds)
      await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600);
    }
    res.locals.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid ownerUuid' });
  }
};
