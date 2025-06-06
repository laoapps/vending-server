import { Request, Response } from 'express';
import models from '../models';

export const createGroup = async (req: Request, res: Response) => {
  const { name } = req.body;
  const user = res.locals.user;

  try {
    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } })
    .then(owner => {
      if (!owner) {
        return res.status(403).json({ error: 'Owner not found' });
      }
      return owner.get({ plain: true });
    });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can create groups' });
    }

    const group = await models.DeviceGroup.create({
      name,
      ownerId: owner.id,
    }).then(group => group.get({ plain: true }));

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to create group' });
  }
};

export const getGroups = async (req: Request, res: Response) => {
  const user = res.locals.user;

  try {
    let groups;
    if (user.role === 'admin') {
      groups = await models.DeviceGroup.findAll({
        include: [
          { model: models.Device, as: 'devices' },
          { model: models.Owner, as: 'owner' },
        ],
      }).then(groups => {
        if (groups.length === 0) {
          return [];
        }
        return groups.map(group => group.get({ plain: true }));
      });
    } else {
      const owner = await models.Owner.findOne({ where: { uuid: user.uuid } })
      .then(owner => {
        if (!owner) {
          return res.status(403).json({ error: 'Owner not found' });
        }
        return owner.get({ plain: true });
      });
      if (!owner) {
        return res.status(403).json({ error: 'Owner not found' });
      }
      groups = await models.DeviceGroup.findAll({
        where: { ownerId: owner.id },
        include: [{ model: models.Device, as: 'devices' }],
      })
      .then(groups => {
        if (groups.length === 0) {
          return [];
        }
        return groups.map(group => group.get({ plain: true }));
      }); 
    }
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch groups' });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const user = res.locals.user;

  try {
    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } })
    .then(owner => {
      if (!owner) {
        return res.status(403).json({ error: 'Owner not found' });
      }
      return owner.get({ plain: true });
    });
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can update groups' });
    }

    const group = await models.DeviceGroup.findOne({ where: { id: parseInt(id), ownerId: owner.id } })
    .then(group => {
      if (!group) {
        return res.status(404).json({ error: 'Group not found or not owned' });
      }
      return group.get({ plain: true });
    });
    if (!group) {
      return res.status(404).json({ error: 'Group not found or not owned' });
    }

    await group.update({ name });
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to update group' });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = res.locals.user;

  try {
    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } }).then(owner => {
      if (!owner) {
        return res.status(403).json({ error: 'Owner not found' });
      }
      return owner.get({ plain: true });
    })
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can delete groups' });
    }

    const group = await models.DeviceGroup.findOne({ where: { id: parseInt(id), ownerId: owner.id } })
    .then(group => {
      if (!group) {
        return res.status(404).json({ error: 'Group not found or not owned' });
      }
      return group.get({ plain: true });
    });
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
    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } }).then(owner => {
      if (!owner) {
        return res.status(403).json({ error: 'Owner not found' });
      }
      return owner.get({ plain: true });  
    })
    if (!owner) {
      return res.status(403).json({ error: 'Only owners can assign devices' });
    }

    const group = await models.DeviceGroup.findOne({ where: { id: groupId, ownerId: owner.id } })
    .then(group => {
      if (!group) {
        return res.status(404).json({ error: 'Group not found or not owned' });
      }
      return group.get({ plain: true });
    }); 
    if (!group) {
      return res.status(404).json({ error: 'Group not found or not owned' });
    }

    const device = await models.Device.findOne({ where: { id: deviceId, ownerId: owner.id } })
    if (!device) {
      return res.status(404).json({ error: 'Device not found or not owned' });
    }

    await device.update({ groupId });
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to assign device to group' });
  }
};