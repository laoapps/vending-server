import { Request, Response } from 'express';
import { DeviceService } from '../services/deviceService';
import { findRealDB } from '../services/userManagerService';
import models from '../models';
import { z } from 'zod';
import { SchedulePackage } from '../models/schedulePackage';
import { Device } from '../models/device';
import { Order } from '../models/order';
import { Op } from 'sequelize';
import redis from '../config/redis';
import { controlDeviceSchema } from '../middleware/validationMiddleware';

// Validation schema for control device

export const createOrder = async (req: Request, res: Response) => {
  const { packageId, deviceId, relay = 1 } = req.body;
  const user = res.locals.user;

  try {
    if (user.role !== 'user') {
      return res.status(403).json({ error: 'Only user can create order' });
    }
    const schedulePackage = await SchedulePackage.findByPk(packageId || -1);
    if (!schedulePackage) {
      return res.status(403).json({ error: 'Package not found' });
    }
    const device = await Device.findByPk(deviceId || -1);
    if (!device) {
      return res.status(403).json({ error: 'Device not found' });
    }

    const order = await Order.create({ deviceId, packageId, userUuid: user.uuid, relay } as any);
    // genearte QR and show QR
    const qr = '';

    redis.setex(`${qr}`, 60 * 5, order.dataValues.id);
    return res.json({ qr, data: { order } });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to create Orders' });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  const user = res.locals.user;
  const offset = req.body.offset || 0;
  const limit = req.body.limit < 5 ? 10 : req.body.limit
  try {
    const orders = await Order.findAll({
      where: { userUuid: user.uuid }, limit, offset,
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch Orders' });
  }
};
export const getOrderById = async (req: Request, res: Response) => {
  const user = res.locals.user;
  const id = req.params.id || -1;
  try {
    const order = await Order.findOne({
      where: { userUuid: user.uuid,id }
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch Orders' });
  }
};



// pay, callback from payment gateway

export const payOrder = async (req: Request, res: Response) => {

  const { transid } = req.body;
  const data = req.body;
  const orderId = redis.get(transid);
  try {
    if (!orderId) {
      return res.status(403).json({ error: 'tranid Id Not found' });
    }
    const order = await Order.findByPk(Number(orderId));
    if (!order) {
      return res.status(403).json({ error: 'order Id Not found' });
    }
    order.set('paidTime', new Date());
    order.set('data', data);

    // paid and start immediately
    order.set('startedTime', new Date());
    const s = await order.save();

    /// start the machine


    // start here
    await DeviceService.controlDevice(s.dataValues.deviceId, { command: 'ON', relay: s.dataValues.relay || 1 });

    console.log('controlDevice222');
    res.json({ message: 'Command sent' });

    res.json(s);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to update device' });
  }
};


// complete from MQTT only
// MQTT server check if 
// device has been completed then send here to update database 
// MQTT server activate the device to be completed if the device still running
export const completeOrder = async (req: Request, res: Response) => {
  const { deviceId } = req.body;

  try {
    const order = await Order.findOne({
      where: {
        [Op.and]: [{
          deviceId,
          startedTime: { [Op.ne]: '', },
          completedTime: { [Op.eq]: '', },
        }]
      }
    })
    if (!order) {
      return res.status(403).json({ error: 'order Id Not found' });
    }
    order.set('completedTime',new Date());
    const s = order?.save();
    res.json(s);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to update device' });
  }
};



