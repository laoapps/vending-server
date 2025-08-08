import { Request, Response } from 'express';
import { SchedulePackage } from '../models/schedulePackage';
import { Device } from '../models/device';
import { Order } from '../models/order';
import { Op } from 'sequelize';
import redis from '../config/redis';
import { DEVICE_CACHE_PREFIX, publishMqttMessage } from '../services/mqttService';
import { notifyStakeholders } from '../services/wsService';
import { generateQR } from '../services/lakService';

export const testOrder = async (req: Request, res: Response) => {
  const { packageId, deviceId, relay = 1 } = req.body;
  const user = res.locals.user;
  console.log('testOrder1111', req.body);

  try {
    const schedulePackage = await SchedulePackage.findByPk(packageId);
    if (!schedulePackage) {
      return res.status(404).json({ error: 'Package not found' });
    }
    const device = await Device.findByPk(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const order = await Order.create({
      uuid: `order-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      deviceId,
      packageId,
      userUuid: user.uuid,
      relay,
    } as any);





    order.set('paidTime', new Date());
    // order.set('data', data);
    order.set('startedTime', new Date());
    await order.save();
    // check if device isActive? return 'want to buy more?' : next

    if (!device?.dataValues?.energy) {
      return res.status(404).json({ error: 'Device energy not found' });
    }

    // Clear existing rule and timer
    await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '');
    await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, '');

    // const current_energy = await redis.get(`${DEVICE_CACHE_PREFIX}${device.dataValues.tasmotaId}`);
    // if(current_energy){

    // }

    if (schedulePackage.dataValues.conditionType === 'energy_consumption') {
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/EnergyReset`, '0');
      const rule = `ON Energy#Total>${(schedulePackage.dataValues.conditionValue / 1000) + (device?.dataValues?.energy || 0)} DO Power${order.dataValues.relay || 1} OFF ENDON`;
      // const rule = `ON Energy#Total>${schedulePackage.dataValues.conditionValue} DO Power${order.dataValues.relay || 1} OFF ENDON`;
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, rule);
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '1');

      const newconditionValue = (device.dataValues.energy || 0) + (schedulePackage.dataValues.conditionValue / 1000)
      const updateNewconditionValue = await order.update({
        conditionValue: newconditionValue
      });
      console.log('updateNewconditionValue', updateNewconditionValue.toJSON());


    } else if (schedulePackage.dataValues.conditionType === 'time_duration') {
      const minutes = Math.ceil(schedulePackage.dataValues.conditionValue);
      const timer = `{"Enable":1,"Mode":0,"Time":"0:${minutes}","Action":0}`;
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, timer);
    }

    const command = 'ON';
    const topic = `cmnd/${device.dataValues.tasmotaId}/POWER${order.dataValues.relay || 1}`;
    await publishMqttMessage(topic, command);

    const orderDetails = {
      orderId: order.dataValues.id,
      deviceId: order.dataValues.deviceId,
      tasmotaId: device.dataValues.tasmotaId,
      packageId: order.dataValues.packageId,
      conditionType: schedulePackage.dataValues.conditionType,
      conditionValue: schedulePackage.dataValues.conditionValue,
      startedTime: order.dataValues.startedTime.getTime(),
      relay: order.dataValues.relay || 1,
    };
    await redis.set(`activeOrder:${order.dataValues.id}`, JSON.stringify(orderDetails), 'EX', 24 * 60 * 60);

    res.json({ message: 'Command sent', order });

    return res.json({ qr: '', data: { order } });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to create order' });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  const { packageId, deviceId, relay = 1 } = req.body;
  const user = res.locals.user;
  console.log('createOrder==========', req.body);

  try {
    if (user.role !== 'user') {
      return res.status(403).json({ error: 'Only users can create orders' });
    }
    const schedulePackage = await SchedulePackage.findByPk(packageId);
    if (!schedulePackage) {
      return res.status(404).json({ error: 'Package not found' });
    }
    const device = await Device.findByPk(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const order = await Order.create({
      uuid: `order-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      deviceId,
      packageId,
      userUuid: user.uuid,
      relay,
    } as any);

    const token = req.headers.authorization?.split(' ')[1];
    const qr = await generateQR(order.dataValues.id, schedulePackage.dataValues.price, token || '');
    console.log('createOrder==========111', qr);

    // await redis.setex(`qr:${qr}`, 5 * 60, order.dataValues.id.toString());
    return res.json({ qr, data: { order } });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to create order' });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  const user = res.locals.user;
  const offset = Number(req.body.offset) || 0;
  const limit = Math.max(Number(req.body.limit), 5) || 10;

  try {
    const orders = await Order.findAll({
      where: { userUuid: user.uuid },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  const user = res.locals.user;
  const id = Number(req.params.id) || -1;

  try {
    const order = await Order.findOne({
      where: { userUuid: user.uuid, id },
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch order' });
  }
};

export const payOrder = async (req: Request, res: Response) => {
  const { orderID, data } = req.body;

  try {
    // const orderId = await redis.get(`qr:${trandID}`);
    // if (!orderId) {
    //   return res.status(403).json({ error: 'Transaction ID not found' });
    // }

    console.log('payOrder==========', req.body);

    const order = await Order.findByPk(Number(orderID));
    console.log('payOrder==========111', order);

    if (!order) {
      return res.status(403).json({ error: 'Order not found' });
    }

    const schedulePackage = await SchedulePackage.findByPk(order.dataValues.packageId);
    if (!schedulePackage) {
      return res.status(403).json({ error: 'Package not found' });
    }

    const device = await Device.findByPk(order.dataValues.deviceId);
    if (!device) {
      return res.status(403).json({ error: 'Device not found' });
    }

    if (!device?.dataValues?.energy) {
      return res.status(404).json({ error: 'Device energy not found' });
    }

    console.log('payOrder==========222', device.dataValues.energy);


    order.set('paidTime', new Date());
    order.set('data', data);
    order.set('startedTime', new Date());
    await order.save();

    // Clear existing rule and timer
    await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '');
    await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, '');

    if (schedulePackage.dataValues.conditionType === 'energy_consumption') {
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/EnergyReset`, '0');
      const rule = `ON Energy#Total>${(schedulePackage.dataValues.conditionValue / 1000) + (device?.dataValues?.energy || 0)} DO Power${order.dataValues.relay || 1} OFF ENDON`;
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, rule);
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '1');

      const newconditionValue = (device.dataValues.energy || 0) + (schedulePackage.dataValues.conditionValue / 1000)
      const updateNewconditionValue = await order.update({
        conditionValue: newconditionValue
      });
      console.log('updateNewconditionValue', updateNewconditionValue.toJSON());
    } else if (schedulePackage.dataValues.conditionType === 'time_duration') {
      const minutes = Math.ceil(schedulePackage.dataValues.conditionValue);
      const timer = `{"Enable":1,"Mode":0,"Time":"0:${minutes}","Action":0}`;
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, timer);
    }

    const command = 'ON';
    const topic = `cmnd/${device.dataValues.tasmotaId}/POWER${order.dataValues.relay || 1}`;
    await publishMqttMessage(topic, command);

    const orderDetails = {
      orderId: order.dataValues.id,
      deviceId: order.dataValues.deviceId,
      tasmotaId: device.dataValues.tasmotaId,
      packageId: order.dataValues.packageId,
      conditionType: schedulePackage.dataValues.conditionType,
      conditionValue: schedulePackage.dataValues.conditionValue,
      startedTime: order.dataValues.startedTime.getTime(),
      relay: order.dataValues.relay || 1,
    };
    await redis.set(`activeOrder:${order.dataValues.id}`, JSON.stringify(orderDetails), 'EX', 24 * 60 * 60);

    res.json({ message: 'Command sent', order });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to process order' });
  }
};

export const completeOrder = async (req: Request, res: Response) => {
  const { deviceId } = req.body;

  try {
    const order = await Order.findOne({
      where: {
        [Op.and]: [
          { deviceId },
          { startedTime: { [Op.ne]: '' } },
          { completedTime: { [Op.eq]: '' } },
        ],
      },
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const device = await Device.findByPk(order.dataValues.deviceId);
    if (device) {
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '');
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, '');
    }
    order.set('completedTime', new Date());
    await order.save();
    await redis.del(`activeOrder:${order.dataValues.id}`);
    await notifyStakeholders(order, 'Order completed via MQTT');
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to complete order' });
  }
};