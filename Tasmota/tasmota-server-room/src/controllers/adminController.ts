import { Request, Response } from 'express';
import models from '../models';

export const getAllData = async (req: Request, res: Response) => {
  const user = res.locals.user;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const owners = await models.Owner.findAll();
    const devices = await models.Device.findAll();
    const groups = await models.DeviceGroup.findAll();

    res.json({ owners, devices, groups, 
      // userDevices
     });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch data' });
  }
};