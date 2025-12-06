import { Request, Response } from 'express';

import { publishMqttMessage } from '../services/mqttService';
import redis from '../config/redis';
import { notifyStakeholders } from '../services/wsService';
import models from '../models';

export const reactivateOrder = async (req: Request, res: Response) => {
  const { orderId } = req.body;
  const user = res.locals.user;

  try {
    const compensationData = await redis.get(`compensation:${orderId}`);
    if (!compensationData) {
      return res.status(403).json({ error: 'No compensation available for this order' });
    }

    const { deviceId, conditionType, compensationValue } = JSON.parse(compensationData);
    const order = await models.Order.findByPk(orderId);
    if (!order) {
      return res.status(403).json({ error: 'Order not found' });
    }

    if (order.dataValues.userUuid !== user.uuid) {
      return res.status(403).json({ error: 'Unauthorized to reactivate this order' });
    }

    const device = await models.Device.findByPk(deviceId);
    if (!device) {
      return res.status(403).json({ error: 'Device not found' });
    }

    const newOrder = await models.Order.create({
      uuid: `order-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      deviceId,
      packageId: order.dataValues.packageId,
      userUuid: order.dataValues.userUuid,
      paidTime: new Date(),
      startedTime: new Date(),
      relay: order.dataValues.relay,
      data: { compensation: true, originalOrderId: orderId },
    } as any);

    await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '');
    if (conditionType === 'energy_consumption') {
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/EnergyReset`, '0');
      const rule = `ON Energy#Total>${compensationValue} DO Power${order.dataValues.relay || 1} OFF ENDON`;
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, rule);
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '1');
    }

    const topic = `cmnd/${device.dataValues.tasmotaId}/POWER${order.dataValues.relay || 1}`;
    await publishMqttMessage(topic, 'ON');

    const orderDetails = {
      orderId: newOrder.dataValues.id,
      deviceId: newOrder.dataValues.deviceId,
      tasmotaId: device.dataValues.tasmotaId,
      packageId: newOrder.dataValues.packageId,
      conditionType,
      conditionValue: compensationValue,
      startedTime: newOrder.dataValues.startedTime.getTime(),
      relay: newOrder.dataValues.relay || 1,
    };
    await redis.set(`activeOrder:${newOrder.dataValues.id}`, JSON.stringify(orderDetails), 'EX', 24 * 60 * 60);

    await redis.del(`compensation:${orderId}`);
    res.json({ message: 'Order reactivated with compensation', newOrder });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to reactivate order' });
  }
};