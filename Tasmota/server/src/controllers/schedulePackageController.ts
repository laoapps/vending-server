import { Request, Response } from 'express';
import models from '../models';

import { Device, DeviceAssociations } from '../models/device';
type DeviceWithAssociations = Device & DeviceAssociations;
export const createSchedulePackage = async (req: Request, res: Response) => {
  const { name, price, conditionType, conditionValue } = req.body;
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
    } as any);

    res.json(schedulePackage);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to create schedule package' });
  }
};

export const findByOwnerID = async (req: Request, res: Response) => {
  const user = res.locals.user;
  const { id } = req.params;
  try {
    const schedulePackages = await models.SchedulePackage.findAll({
      where: { ownerId: Number(id+'') }
    });
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
      schedulePackages = await models.SchedulePackage.findAll({
        include: [{ model: models.Owner, as: 'owner' }],
      });
    } else if (user.role === 'owner') {
      const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
      if (!owner) {
        return res.status(404).json({ error: 'Owner not found' });
      }
      schedulePackages = await models.SchedulePackage.findAll({
        where: { ownerId: owner.dataValues.id },
        include: [{ model: models.Owner, as: 'owner' }],
      });
    } else {
      schedulePackages = await models.SchedulePackage.findAll({
        include: [{ model: models.Owner, as: 'owner' }],
      });
    }
    res.json(schedulePackages);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch schedule packages' });
  }
};

export const updateSchedulePackage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, price, conditionType, conditionValue } = req.body;
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

    await schedulePackage.update({ name, price, conditionType, conditionValue });
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

// export const applySchedulePackage = async (req: Request, res: Response) => {
//   const { deviceId, packageId } = req.body;
//   const user = res.locals.user;

//   try {
//     const device: DeviceWithAssociations | null= await models.Device.findByPk(deviceId, {
//       include: [
//         { model: models.Owner, as: 'owner' },
//         { model: models.UserDevice, as: 'userDevices' },
//       ],
//     });

//     if (!device) {
//       return res.status(404).json({ error: 'Device not found' });
//     }

//     const isOwner = device.owner?.uuid === user.uuid;
//     const isAssignedUser = device.userDevices?.some((ud: any) => ud.userUuid === user.uuid);
//     if (!isOwner && !isAssignedUser && user.role !== 'admin') {
//       return res.status(403).json({ error: 'Unauthorized to apply schedule package' });
//     }

//     const schedulePackage = await models.SchedulePackage.findByPk(packageId);
//     if (!schedulePackage) {
//       return res.status(404).json({ error: 'Schedule package not found' });
//     }

//     const existingSchedule = await models.Schedule.findOne({
//       where: { deviceId, packageId, active: true },
//     });
//     if (existingSchedule) {
//       return res.status(400).json({ error: 'Active schedule already exists for this device and package' });
//     }

//     if (!device.dataValues.energy && schedulePackage.dataValues.conditionType === 'energy_consumption') {
//       return res.status(400).json({ error: 'No energy data available for this device' });
//     }

//     let scheduleData: any = {
//       deviceId,
//       packageId,
//       type: schedulePackage.dataValues.conditionType === 'time_duration' ? 'timer' : 'conditional',
//       command: 'POWER ON',
//       createdBy: user.uuid,
//       active: true,
//     };

//     if (schedulePackage.dataValues.conditionType === 'time_duration') {
//       const durationHours = schedulePackage.dataValues.conditionValue;
//       scheduleData.cron = `0 0 */${Math.round(durationHours)} * * *`;
//     } else if (schedulePackage.dataValues.conditionType === 'energy_consumption') {
//       scheduleData.conditionType = 'energy_limit';
//       scheduleData.conditionValue = schedulePackage.dataValues.conditionValue;
//       scheduleData.command = 'POWER OFF';
//       scheduleData.startEnergy = device.dataValues.energy ?? 0;
//     }

//     const schedule = await models.Schedule.create(scheduleData);

//     if (scheduleData.type === 'timer' && scheduleData.cron) {
//       await scheduleJob(schedule as any);
//     }

//     res.json(schedule);
//   } catch (error) {
//     res.status(500).json({ error: (error as Error).message || 'Failed to apply schedule package' });
//   }
// };