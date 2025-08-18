import { Request, Response } from 'express';
import models from '../models';

import { Device, DeviceAssociations } from '../models/device';
import { Op } from 'sequelize';
type DeviceWithAssociations = Device & DeviceAssociations;
export const createSchedulePackage = async (req: Request, res: Response) => {
  const { name, price, conditionType, conditionValue, description } = req.body;
  console.log('createSchedulePackage',req.body, description);
  
  const user = res.locals.user;

  try {
    if (user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can create schedule packages' });
    }

    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    if (!['time_duration', 'energy_consumption'].includes(conditionType)) {
      return res.status(400).json({ error: 'Invalid condition type' });
    }

    const schedulePackage = await models.SchedulePackage.create({
      name,
      ownerId: owner.dataValues.id,
      price,
      conditionType,
      conditionValue,
      description
    } as any);

    res.json(schedulePackage);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to create schedule package' });
  }
};

export const findByOwnerID = async (req: Request, res: Response) => {
  const user = res.locals.user;
  const { id } = req.params;
  console.log('findByOwnerID', id);

  try {
    const getid = Number(id + '')
    const schedulePackages = await models.SchedulePackage.findAll({
      where: { ownerId: getid }
    });

    console.log('findByOwnerID111', schedulePackages);

    res.json(schedulePackages);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch schedule packages' });
  }
};

export const findByPackageIDs = async (req: Request, res: Response) => {
  const user = res.locals.user;
  const { packages } = req.body;
  console.log('findByPackageIDs', packages);
  try {

    if(!packages?.length){
      return res.status(403).json({ error: 'body is empty!' });
    }
    const schedulePackages = await models.SchedulePackage.findAll({
      where: { id: {[Op.in]: packages} }
    });

    console.log('findByPackageIDs111', schedulePackages);

    res.json(schedulePackages);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch schedule packages' });
  }
};

export const findByPackageIDsHMVending = async (req: Request, res: Response) => {
  const user = res.locals.user;
  const { packages } = req.body;
  console.log('findByPackageIDsHMVending', packages);
  try {
    if(!packages?.length){
      return res.status(403).json({ error: 'body is empty!' });
    }
    const schedulePackages = await models.SchedulePackage.findAll({
      where: { id: {[Op.in]: packages} }
    });
    console.log('findByPackageIDsHMVending111', schedulePackages);
    res.json(schedulePackages);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch schedule packages' });
  }
};

export const findByOwnerIDHMVending = async (req: Request, res: Response) => {
  const user = res.locals.user;
  try {
    const owner = await models.Owner.findOne({where:{uuid:user.uuid}});
    const schedulePackages = await models.SchedulePackage.findAll({
      where: { ownerId: owner?.dataValues.id }
    });
    console.log('findByOwnerID111', schedulePackages);
    res.json(schedulePackages);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch schedule packages' });
  }
};

export const getSchedulePackages = async (req: Request, res: Response) => {
  const user = res.locals.user;
  try {
    let schedulePackages;
    if (user.role === 'admin') {
      schedulePackages = await models.SchedulePackage.findAll();
    } else if (user.role === 'owner') {
      const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
      if (!owner) {
        return res.status(404).json({ error: 'Owner not found' });
      }
      schedulePackages = await models.SchedulePackage.findAll({
        where: { ownerId: owner.dataValues.id },
      });
    } else {
      schedulePackages = await models.SchedulePackage.findAll();
    }
    res.json(schedulePackages);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch schedule packages' });
  }
};

export const updateSchedulePackage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, price, conditionType, conditionValue, description } = req.body;
  const user = res.locals.user;

  try {
    if (user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can update schedule packages' });
    }

    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    const schedulePackage = await models.SchedulePackage.findOne({ where: { id: parseInt(id), ownerId: owner.dataValues.id } });
    if (!schedulePackage) {
      return res.status(404).json({ error: 'Schedule package not found or not owned' });
    }

    if (conditionType && !['time_duration', 'energy_consumption'].includes(conditionType)) {
      return res.status(400).json({ error: 'Invalid condition type' });
    }

    await schedulePackage.update({ name, price, conditionType, conditionValue, description });
    res.json(schedulePackage);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to update schedule package' });
  }
};

export const deleteSchedulePackage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = res.locals.user;

  try {
    if (user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can delete schedule packages' });
    }

    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    const schedulePackage = await models.SchedulePackage.findOne({ where: { id: parseInt(id), ownerId: owner.dataValues.id } });
    if (!schedulePackage) {
      return res.status(404).json({ error: 'Schedule package not found or not owned' });
    }

    // const schedules = await models.Schedule.findAll({ where: { packageId: schedulePackage.dataValues.id } });
    // if (schedules.length > 0) {
    //   return res.status(400).json({ error: 'Cannot delete package with active schedules' });
    // }

    await schedulePackage.destroy();
    res.json({ message: 'Schedule package deleted' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to delete schedule package' });
  }
};