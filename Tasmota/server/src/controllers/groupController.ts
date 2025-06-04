import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createGroup = async (req: Request, res: Response) => {
  const { name } = req.body;
  const user = res.locals.user;

  try {
    const owner = await prisma.owner.findUnique({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can create groups' });
    }

    const group = await prisma.deviceGroup.create({
      data: { name, ownerId: owner.id },
    });

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group' });
  }
};

export const getGroups = async (req: Request, res: Response) => {
  const user = res.locals.user;

  try {
    let groups;
    if (user.role === 'admin') {
      groups = await prisma.deviceGroup.findMany({ include: { devices: true, owner: true } });
    } else {
      const owner = await prisma.owner.findUnique({ where: { uuid: user.uuid } });
      groups = await prisma.deviceGroup.findMany({ where: { ownerId: owner!.id }, include: { devices: true } });
    }
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const user = res.locals.user;

  try {
    const owner = await prisma.owner.findUnique({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can update groups' });
    }

    const group = await prisma.deviceGroup.update({
      where: { id: parseInt(id), ownerId: owner.id },
      data: { name },
    });

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update group' });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = res.locals.user;

  try {
    const owner = await prisma.owner.findUnique({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can delete groups' });
    }

    await prisma.deviceGroup.delete({
      where: { id: parseInt(id), ownerId: owner.id },
    });

    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete group' });
  }
};

export const assignDeviceToGroup = async (req: Request, res: Response) => {
  const { groupId, deviceId } = req.body;
  const user = res.locals.user;

  try {
    const owner = await prisma.owner.findUnique({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can assign devices' });
    }

    const group = await prisma.deviceGroup.findUnique({ where: { id: groupId, ownerId: owner.id } });
    if (!group) {
      return res.status(403).json({ error: 'Group not found or not owned' });
    }

    const device = await prisma.device.findUnique({ where: { id: deviceId, ownerId: owner.id } });
    if (!device) {
      return res.status(403).json({ error: 'Device not found or not owned' });
    }

    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: { groupId },
    });

    res.json(updatedDevice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign device to group' });
  }
};