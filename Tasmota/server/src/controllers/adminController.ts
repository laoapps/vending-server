import { Request, Response } from 'express';
import models from '../models';

export const getAllData = async (req: Request, res: Response) => {
  const user = res.locals.user;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const owners = await models.Owner.findAll({
      include: [
        { model: models.Device, as: 'devices' },
        { model: models.DeviceGroup, as: 'groups' },
      ],
    });
    const devices = await models.Device.findAll({
      include: [
        { model: models.Owner, as: 'owner' },
        { model: models.UserDevice, as: 'userDevices' },
        { model: models.DeviceGroup, as: 'deviceGroup' },
      ],
    });
    const groups = await models.DeviceGroup.findAll({
      include: [
        { model: models.Device, as: 'devices' },
        { model: models.Owner, as: 'owner' },
      ],
    });
    const schedules = await models.Schedule.findAll({
      include: [{ model: models.Device, as: 'device' }],
    });
    // Fetch user devices with associated device information
    const userDevices = await models.UserDevice.findAll({
      include: [{ model: models.Device, as: 'device' }],
    });

    res.json({ owners, devices, groups, schedules, userDevices });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch data' });
  }
};