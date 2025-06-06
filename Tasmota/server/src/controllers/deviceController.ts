import { Request, Response } from 'express';
import { DeviceService } from '../services/deviceService';
import { findRealDB } from '../services/userManagerService';
import models from '../models';
import { publishMqttMessage } from '../services/mqttService';

export const createDevice = async (req: Request, res: Response) => {
  const { name, tasmotaId, zone } = req.body;
  const user = res.locals.user;

  try {
    if (user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can create devices' });
    }
    const device = await DeviceService.createDevice(user.uuid, name, tasmotaId, zone);
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
    const device = await models.Device.findByPk(deviceId, {
      include: [
        { model: models.Owner, as: 'owner' },
        { model: models.UserDevice, as: 'userDevices' },
      ],
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const isOwner = device.owner?.uuid === user.uuid;
    const isAssignedUser = device.userDevices?.some((ud: any) => ud.userUuid === user.uuid);
    if (!isOwner && !isAssignedUser && user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to control device' });
    }

    const topic = `cmnd/${device.tasmotaId}/POWER`;
    console.log(`Controlling device ${device.tasmotaId} ${topic} ${command}`);
    await publishMqttMessage(topic, command);

    res.json({ message: 'Command sent' });
  } catch (error) {
    console.error(`Error controlling device ${deviceId}:`, error);
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