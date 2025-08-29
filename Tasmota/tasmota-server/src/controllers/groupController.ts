import { Request, Response } from 'express';
import models from '../models';

export const createGroup = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const user = res.locals.user;

  try {
    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can create groups' });
    }

    const group = await models.DeviceGroup.create({
      name,
      description,
      ownerId: owner.dataValues.id,
    } as any);

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to create group' });
  }
};

export const loadAllGroups = async (req: Request, res: Response) => {
  try {
    const groups = await models.DeviceGroup.findAll({ where: { isActive: true } });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch groups' });
  }
};

export const getGroups_forAddDevice = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
      if (!owner) {
        return res.status(403).json({ error: 'Owner not found' });
      }
      const groups = await models.DeviceGroup.findAll({
        where: { ownerId: owner.dataValues.id },
      });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch groups' });
  }
};

export const getGroups = async (req: Request, res: Response) => {
  const user = res.locals.user;

  try {
    let groups;
    if (user.role === 'admin') {
      groups = await models.DeviceGroup.findAll();
    } else {
      const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
      if (!owner) {
        return res.status(403).json({ error: 'Owner not found' });
      }
      groups = await models.DeviceGroup.findAll({
        where: { ownerId: owner.dataValues.id, isActive: true },
      });
    }
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch groups' });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const user = res.locals.user;

  try {
    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can update groups' });
    }

    const group = await models.DeviceGroup.findOne({ where: { id: parseInt(id), ownerId: owner.dataValues.id } });
    if (!group) {
      return res.status(404).json({ error: 'Group not found or not owned' });
    }

    await group.update({ name, description });
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to update group' });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = res.locals.user;

  try {
    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can delete groups' });
    }

    const group = await models.DeviceGroup.findOne({ where: { id: parseInt(id), ownerId: owner.dataValues.id } });
    if (!group) {
      return res.status(404).json({ error: 'Group not found or not owned' });
    }

    await group.destroy();
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to delete group' });
  }
};

export const assignDeviceToGroup = async (req: Request, res: Response) => {
  const { groupId, deviceId } = req.body;
  const user = res.locals.user;

  try {
    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can assign devices' });
    }

    const group = await models.DeviceGroup.findOne({ where: { id: groupId, ownerId: owner.dataValues.id } })
    if (!group) {
      return res.status(404).json({ error: 'Group not found or not owned' });
    }

    const device = await models.Device.findOne({ where: { id: deviceId, ownerId: owner.dataValues.id } })
    if (!device) {
      return res.status(404).json({ error: 'Device not found or not owned' });
    }

    await device.update({ groupId });
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to assign device to group' });
  }
};