import { Request, Response } from 'express';
import models from '../models';
import { scheduleJob } from '../services/scheduleService';

export const createSchedule = async (req: Request, res: Response) => {
  const { deviceId, type, cron, command, conditionType, conditionValue, active } = req.body;
  const user = res.locals.user;

  try {
    if (user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can create schedules' });
    }

    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    const device = await models.Device.findOne({ where: { id: deviceId, ownerId: owner.id } });
    if (!device) {
      return res.status(404).json({ error: 'Device not found or not owned' });
    }

    const schedule = await models.Schedule.create({
      deviceId,
      type,
      cron,
      command,
      conditionType,
      conditionValue,
      active: active !== undefined ? active : true,
      createdBy: user.uuid,
    } as any);

    if (type === 'timer' && cron) {
      await scheduleJob(schedule);
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to create schedule' });
  }
};

export const getSchedules = async (req: Request, res: Response) => {
  const user = res.locals.user;

  try {
    let schedules;
    if (user.role === 'admin') {
      schedules = await models.Schedule.findAll({
        include: [
          { model: models.Device, as: 'device' },
          { model: models.SchedulePackage, as: 'package' },
        ],
      });
    } else if (user.role === 'owner') {
      const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
      if (!owner) {
        return res.status(404).json({ error: 'Owner not found' });
      }
      schedules = await models.Schedule.findAll({
        include: [
          {
            model: models.Device,
            as: 'device',
            where: { ownerId: owner.id },
          },
          { model: models.SchedulePackage, as: 'package' },
        ],
      });
    } else {
      schedules = await models.Schedule.findAll({
        include: [
          {
            model: models.Device,
            as: 'device',
            include: [{ model: models.UserDevice, as: 'userDevices', where: { userUuid: user.uuid } }],
          },
          { model: models.SchedulePackage, as: 'package' },
        ],
      });
    }
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch schedules' });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { deviceId, type, cron, command, conditionType, conditionValue, active } = req.body;
  const user = res.locals.user;

  try {
    if (user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can update schedules' });
    }

    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    const schedule = await models.Schedule.findOne({
      where: { id: parseInt(id) },
      include: [{ model: models.Device, as: 'device' }],
    });
    if (!schedule || schedule.device?.ownerId !== owner.id) {
      return res.status(404).json({ error: 'Schedule not found or not owned' });
    }

    await schedule.update({
      deviceId,
      type,
      cron,
      command,
      conditionType,
      conditionValue,
      active,
      createdBy: user.uuid,
    });

    if (type === 'timer' && cron) {
      await scheduleJob(schedule);
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to update schedule' });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = res.locals.user;

  try {
    if (user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can delete schedules' });
    }

    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    const schedule = await models.Schedule.findOne({
      where: { id: parseInt(id) },
      include: [{ model: models.Device, as: 'device' }],
    });
    if (!schedule || schedule.device?.ownerId !== owner.id) {
      return res.status(404).json({ error: 'Schedule not found or not owned' });
    }

    // Prevent deletion if linked to a schedule package
    if (schedule.packageId) {
      return res.status(400).json({ error: 'Cannot delete schedule linked to a schedule package' });
    }

    await schedule.destroy();
    res.json({ message: 'Schedule deleted' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to delete schedule' });
  }
};