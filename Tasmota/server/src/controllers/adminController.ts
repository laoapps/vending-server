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
    }).then(owners =>{
      if(owners.length === 0) {
        return [];
      }
      return owners.map(owner => owner.get({ plain: true }));
    });
    const devices = await models.Device.findAll({
      include: [
        { model: models.Owner, as: 'owner' },
        { model: models.UserDevice, as: 'userDevices' },
        { model: models.DeviceGroup, as: 'deviceGroup' },
      ],
    }).then(devices => {
      if(devices.length === 0) {
        return [];
      }
      return devices.map(device => device.get({ plain: true }));
    });
    const groups = await models.DeviceGroup.findAll({
      include: [
        { model: models.Device, as: 'devices' },
        { model: models.Owner, as: 'owner' },
      ],
    }).then(groups => {
      if(groups.length === 0) {
        return [];
      }
      return groups.map(group => group.get({ plain: true }));
    });
    const schedules = await models.Schedule.findAll({
      include: [{ model: models.Device, as: 'device' }],
    }).then(schedules => {
      if(schedules.length === 0) {
        return [];
      }
      return schedules.map(schedule => schedule.get({ plain: true }));
    });
    // Fetch user devices with associated device information
    const userDevices = await models.UserDevice.findAll({
      include: [{ model: models.Device, as: 'device' }],
    }).then(userDevices => {
      if(userDevices.length === 0) {
        return [];
      }
      return userDevices.map(userDevice => userDevice.get({ plain: true }));
    });

    res.json({ owners, devices, groups, schedules, userDevices });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch data' });
  }
};