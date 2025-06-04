import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { publishMqttMessage } from '../services/mqttService';
import { findUuidByPhoneNumberOnUserManager } from '../services/userManagerService';
const prisma = new PrismaClient();

export const createDevice = async (req: Request, res: Response) => {
  const { name, tasmotaId, zone } = req.body;
  const user = res.locals.user;

  try {
    const owner = await prisma.owner.findUnique({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can create devices' });
    }

    const device = await prisma.device.create({
      data: { name, tasmotaId, zone, ownerId: owner.id, status: {} },
    });

    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create device' });
  }
};

export const getDevices = async (req: Request, res: Response) => {
  const user = res.locals.user;

  try {
    let devices;
    if (user.role === 'admin') {
      devices = await prisma.device.findMany({ include: { owner: true, userDevices: true, group: true } });
    } else if (user.role === 'owner') {
      const owner = await prisma.owner.findUnique({ where: { uuid: user.uuid } });
      devices = await prisma.device.findMany({ where: { ownerId: owner!.id }, include: { userDevices: true, group: true } });
    } else {
      devices = await prisma.device.findMany({
        where: { userDevices: { some: { userUuid: user.uuid } } },
        include: { owner: true, group: true },
      });
    }
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
};

export const updateDevice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, tasmotaId, zone, groupId } = req.body;
  const user = res.locals.user;

  try {
    const owner = await prisma.owner.findUnique({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can update devices' });
    }

    const device = await prisma.device.update({
      where: { id: parseInt(id), ownerId: owner.id },
      data: { name, tasmotaId, zone, groupId },
    });

    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update device' });
  }
};

export const deleteDevice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = res.locals.user;

  try {
    const owner = await prisma.owner.findUnique({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can delete devices' });
    }

    await prisma.device.delete({
      where: { id: parseInt(id), ownerId: owner.id },
    });

    res.json({ message: 'Device deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete device' });
  }
};

export const controlDevice = async (req: Request, res: Response) => {
  const { deviceId, command } = req.body;
  const user = res.locals.user;

  try {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { owner: true, userDevices: true },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const isOwner = device.owner.uuid === user.uuid;
    const isAssignedUser = device.userDevices.some((ud) => ud.userUuid === user.uuid);
    if (!isOwner && !isAssignedUser && user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await publishMqttMessage(`cmnd/${device.tasmotaId}/${command}`, '');

    res.json({ message: 'Command sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to control device' });
  }
};

export const assignDeviceToUser = async (req: Request, res: Response) => {
  const { deviceId, userPhoneNumber } = req.body;
  const user = res.locals.user;

  try {
    const owner = await prisma.owner.findUnique({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can assign devices' });
    }

    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device || device.ownerId !== owner.id) {
      return res.status(403).json({ error: 'Device not found or not owned' });
    }

    const userData = await findUuidByPhoneNumberOnUserManager(userPhoneNumber);
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userDevice = await prisma.userDevice.create({
      data: { userUuid: userData.uuid, deviceId },
    });

    res.json(userDevice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign device' });
  }
};