import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllData = async (req: Request, res: Response) => {
  const user = res.locals.user;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const owners = await prisma.owner.findMany({ include: { devices: true, groups: true } });
    const devices = await prisma.device.findMany({ include: { owner: true, userDevices: true, group: true } });
    const groups = await prisma.deviceGroup.findMany({ include: { devices: true, owner: true } });
    const schedules = await prisma.schedule.findMany({ include: { device: true } });
    const userDevices = await prisma.userDevice.findMany({ include: { device: true } });

    res.json({ owners, devices, groups, schedules, userDevices });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};