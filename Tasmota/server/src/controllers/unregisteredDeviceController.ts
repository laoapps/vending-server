import { Request, Response } from 'express';
import models from '../models';

export const getUnregisteredDevices = async (req: Request, res: Response) => {
  const user = res.locals.user;

  try {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view unregistered devices' });
    }
    const devices = await models.UnregisteredDevice.findAll();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch unregistered devices' });
  }
};

export const banUnregisteredDevice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = res.locals.user;

  try {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can ban unregistered devices' });
    }
    const device = await models.UnregisteredDevice.findByPk(parseInt(id));
    if (!device) {
      return res.status(404).json({ error: 'Unregistered device not found' });
    }
    await device.update({ isBanned: true });
    res.json({ message: 'Device banned' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to ban unregistered device' });
  }
};

export const unbanUnregisteredDevice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = res.locals.user;

  try {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can unban unregistered devices' });
    }
    const device = await models.UnregisteredDevice.findByPk(parseInt(id));
    if (!device) {
      return res.status(404).json({ error: 'Unregistered device not found' });
    }
    await device.update({ isBanned: false, connectionAttempts: 0, lastConnections: [] });
    res.json({ message: 'Device unbanned' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to unban unregistered device' });
  }
};