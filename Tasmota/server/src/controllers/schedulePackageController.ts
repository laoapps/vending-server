import { Request, Response } from 'express';
import models from '../models';
import { scheduleJob } from '../services/scheduleService';

export const createSchedulePackage = async (req: Request, res: Response) => {
  const { name, durationMinutes, powerConsumptionWatts, price } = req.body;
  const user = res.locals.user;

  try {
    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can create schedule packages' });
    }

    const schedulePackage = await models.SchedulePackage.create({
      name,
      ownerId: owner.id,
      durationMinutes,
      powerConsumptionWatts,
      price,
    } as any);

    res.json(schedulePackage);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to create schedule package' });
  }
};

export const getSchedulePackages = async (req: Request, res: Response) => {
  const user = res.locals.user;

  try {
    let schedulePackages;
    if (user.role === 'admin') {
      schedulePackages = await models.SchedulePackage.findAll({
        include: [{ model: models.Owner, as: 'owner' }],
      });
    } else {
      const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
      if (!owner) {
        return res.status(403).json({ error: 'Owner not found' });
      }
      schedulePackages = await models.SchedulePackage.findAll({
        where: { ownerId: owner.id },
      });
    }
    res.json(schedulePackages);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch schedule packages' });
  }
};

export const updateSchedulePackage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, durationMinutes, powerConsumptionWatts, price } = req.body;
  const user = res.locals.user;

  try {
    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can update schedule packages' });
    }

    const schedulePackage = await models.SchedulePackage.findOne({ where: { id: parseInt(id), ownerId: owner.id } });
    if (!schedulePackage) {
      return res.status(404).json({ error: 'Schedule package not found or not owned' });
    }

    await schedulePackage.update({ name, durationMinutes, powerConsumptionWatts, price });
    res.json(schedulePackage);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to update schedule package' });
  }
};

export const deleteSchedulePackage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = res.locals.user;

  try {
    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can delete schedule packages' });
    }

    const schedulePackage = await models.SchedulePackage.findOne({ where: { id: parseInt(id), ownerId: owner.id } });
    if (!schedulePackage) {
      return res.status(404).json({ error: 'Schedule package not found or not owned' });
    }

    await schedulePackage.destroy();
    res.json({ message: 'Schedule package deleted' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to delete schedule package' });
  }
};

export const applySchedulePackage = async (req: Request, res: Response) => {
  const { deviceId, packageId } = req.body;
  const user = res.locals.user;

  try {
    // Allow owners or assigned users to apply packages
    const device = await models.Device.findByPk(deviceId, {
      include: [
        { model: models.Owner, as: 'owner' },
        { model: models.UserDevice, as: 'userDevices' },
      ],
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const isOwner = device.owner?.uuid === user.uuid;
    const isAssignedUser = device.userDevices?.some((ud: any) => ud.userUuid === user.uuid);
    if (!isOwner && !isAssignedUser && user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to apply schedule package' });
    }

    const schedulePackage = await models.SchedulePackage.findByPk(packageId);
    if (!schedulePackage) {
      return res.status(404).json({ error: 'Schedule package not found' });
    }

    // Create a schedule based on the package
    let scheduleData: any = {
      deviceId,
      type: 'conditional',
      command: 'POWER ON',
      createdBy: user.uuid,
    };

    if (schedulePackage.durationMinutes) {
      // Convert duration to cron (e.g., every X minutes)
      scheduleData.type = 'timer';
      scheduleData.cron = `*/${schedulePackage.durationMinutes} * * * *`;
    }

    if (schedulePackage.powerConsumptionWatts) {
      scheduleData.conditionType = 'power_overload';
      scheduleData.conditionValue = schedulePackage.powerConsumptionWatts;
      scheduleData.command = 'POWER OFF';
    }

    const schedule = await models.Schedule.create(scheduleData);

    if (scheduleData.type === 'timer' && scheduleData.cron) {
      await scheduleJob(schedule);
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to apply schedule package' });
  }
};