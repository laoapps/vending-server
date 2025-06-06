import { Request, Response } from 'express';
import { DeviceService } from '../services/deviceService';
import { findRealDB } from '../services/userManagerService';
import models from '../models';

export const createDevice = async (req: Request, res: Response) => {
  const { name, tasmotaId, zone } = req.body;
  const user = res.locals.user;

  try {
    if (user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can create devices' });
    }
    console.log('Creating device for user:', user.uuid, 'Name:', name, 'Tasmota ID:', tasmotaId, 'Zone:', zone);
    const device = await DeviceService.createDevice(user.uuid, name, tasmotaId, zone);
    console.log('Device created:', device);
    // Remove from UnregisteredDevices if exists
    await models.UnregisteredDevice.destroy({ where: { tasmotaId } });
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to create device' });
  }
};

export const getDevices = async (req: Request, res: Response) => {
  const user = res.locals.user;

  try {
    const devices = await DeviceService.getDevices(user);
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch devices' });
  }
};

export const updateDevice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, tasmotaId, zone, groupId } = req.body;
  const user = res.locals.user;

  try {
    if (user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can update devices' });
    }
    const device = await DeviceService.updateDevice(user.uuid, parseInt(id), { name, tasmotaId, zone, groupId });
    // Remove from UnregisteredDevices if tasmotaId changes
    await models.UnregisteredDevice.destroy({ where: { tasmotaId } });
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to update device' });
  }
};

export const deleteDevice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = res.locals.user;

  try {
    if (user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can delete devices' });
    }
    await DeviceService.deleteDevice(user.uuid, parseInt(id));
    res.json({ message: 'Device deleted' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to delete device' });
  }
};

export const controlDevice = async (req: Request, res: Response) => {
  const { deviceId, command } = req.body;
  const user = res.locals.user;

  try {
    await DeviceService.controlDevice(user, deviceId, command);
    res.json({ message: 'Command sent' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to control device' });
  }
};

export const assignDeviceToUser = async (req: Request, res: Response) => {
  const { deviceId, token } = req.body;
  const user = res.locals.user;

  try {
    if (user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can assign devices' });
    }

    const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
    if (!owner) {
      return res.status(403).json({ error: 'Owner not found' });
    }

    const device = await models.Device.findOne({ where: { id: deviceId, ownerId: owner.id } });
    if (!device) {
      return res.status(404).json({ error: 'Device not found or not owned' });
    }

    const userUuid = await findRealDB(token);
    if (!userUuid) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userDevice = await models.UserDevice.create({
      userUuid,
      deviceId,
    });

    res.json(userDevice);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to assign device' });
  }
};