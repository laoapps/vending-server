import { Request, Response } from 'express';
import { DeviceService } from '../services/deviceService';

export const createDevice = async (req: Request, res: Response) => {
  const { name, tasmotaId, zone } = req.body;
  const user = res.locals.user;

  try {
    const device = await DeviceService.createDevice(user.uuid, name, tasmotaId, zone);
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
    const device = await DeviceService.updateDevice(user.uuid, parseInt(id), { name, tasmotaId, zone, groupId });
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to update device' });
  }
};

export const deleteDevice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = res.locals.user;

  try {
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
  const { deviceId, userPhoneNumber } = req.body;
  const user = res.locals.user;

  try {
    const userDevice = await DeviceService.assignDeviceToUser(user.uuid, deviceId, userPhoneNumber);
    res.json(userDevice);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to assign device' });
  }
};