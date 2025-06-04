import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { scheduleJob } from '../services/scheduleService';

const prisma = new PrismaClient();

export const createSchedule = async (req: Request, res: Response) => {
  const { deviceId, type, cron, command, conditionType, conditionValue } = req.body;
  const user = res.locals.user;

  try {
    const owner = await prisma.owner.findUnique({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can create schedules' });
    }

    const device = await prisma.device.findUnique({ where: { id: deviceId, ownerId: owner.id } });
    if (!device) {
      return res.status(403).json({ error: 'Device not found or not owned' });
    }

    const schedule = await prisma.schedule.create({
      data: { deviceId, type, cron, command, conditionType, conditionValue },
    });

    if (type === 'timer' && cron) {
      scheduleJob(schedule);
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create schedule' });
  }
};

export const getSchedules = async (req: Request, res: Response) => {
  const user = res.locals.user;

  try {
    let schedules;
    if (user.role === 'admin') {
      schedules = await prisma.schedule.findMany({ include: { device: true } });
    } else {
      const owner = await prisma.owner.findUnique({ where: { uuid: user.uuid } });
      schedules = await prisma.schedule.findMany({
        where: { device: { ownerId: owner!.id } },
        include: { device: true },
      });
    }
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, cron, command, conditionType, conditionValue, active } = req.body;
  const user = res.locals.user;

  try {
    const owner = await prisma.owner.findUnique({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can update schedules' });
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: parseInt(id) },
      include: { device: true },
    });
    if (!schedule || schedule.device.ownerId !== owner.id) {
      return res.status(403).json({ error: 'Schedule not found or not owned' });
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { id: parseInt(id) },
      data: { type, cron, command, conditionType, conditionValue, active },
    });

    if (type === 'timer' && cron && active) {
      scheduleJob(updatedSchedule);
    }

    res.json(updatedSchedule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update schedule' });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = res.locals.user;

  try {
    const owner = await prisma.owner.findUnique({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can delete schedules' });
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: parseInt(id) },
      include: { device: true },
    });
    if (!schedule || schedule.device.ownerId !== owner.id) {
      return res.status(403).json({ error: 'Schedule not found or not owned' });
    }

    await prisma.schedule.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Schedule deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
};