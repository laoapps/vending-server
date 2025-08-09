import { Request, Response } from 'express';
import { DeviceService } from '../services/deviceService';
import { findRealDB } from '../services/userManagerService';
import models from '../models';
import { z } from 'zod';
import { publishMqttMessage } from '../services/mqttService';
import { Device } from '../models/device';

// Validation schema for control device
const controlDeviceSchema = z.object({
  deviceId: z.number().int().positive(),
  command: z.enum(['ON', 'OFF', 'TOGGLE']).optional(),
  relay: z.number().int().min(1).optional(),
});

export const createDevice = async (req: Request, res: Response) => {
  const { name, tasmotaId, zone, groupId } = req.body;
  const user = res.locals.user;
  console.log('createDevice', name, tasmotaId, zone, groupId, user);
  try {
    if (user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can create devices' });
    }
    const device = await DeviceService.createDevice(user.uuid, name, tasmotaId, zone, groupId);
    console.log('createDevice4', device);

    // await models.UnregisteredDevice.destroy({ where: { tasmotaId } });
    res.json(device);
  } catch (error) {
    console.log('createDeviceERROR', error);
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

export const getDevicesBy = async (req: Request, res: Response) => {
  const user = res.locals.user;
  const { ownerId, id } = req.body;
  if (!ownerId) {
    return res.status(403).json({ error: 'Owner not found' });
  }
  try {
    const devices = await DeviceService.getDevicesBy({ ownerId, id });
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
    // await models.UnregisteredDevice.destroy({ where: { tasmotaId } });
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
  const user = res.locals.user;

  try {
    console.log('controlDevice000');
    const input = controlDeviceSchema.parse(req.body);
    console.log('controlDevice111', input);

    await DeviceService.controlDevice(input.deviceId, { command: input.command, relay: input.relay });

    console.log('controlDevice222');
    res.json({ message: 'Command sent' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: (error as Error).message || 'Failed to control device' });
    }
  }
};

export const clearDeviceRule = async (req: Request, res: Response) => {
  const { deviceId, relay = 1 } = req.body;
  const user = res.locals.user;
  try {
    console.log('clearDeviceRule000', deviceId, relay);
    const device = await Device.findByPk(deviceId);
    console.log('clearDeviceRule111', device?.toJSON());
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // 1. ปิดการทำงานของ Rule ก่อน
    await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '0');

    // 2. เคลียร์ Rule
    await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '');

    // 3. ปิดการทำงานของ Timer
    await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, '0');

    // 4. เคลียร์ค่า Timer
    await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, '');

    // 5. เปิด Relay ตามต้องการ
    const command = 'ON';
    const topic = `cmnd/${device.dataValues.tasmotaId}/POWER${relay || 1}`;
    await publishMqttMessage(topic, command);


    console.log('controlDevice222');
    res.json({ message: 'Command sent' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: (error as Error).message || 'Failed to control device' });
    }
  }
};