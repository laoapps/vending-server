

import { publishMqttMessage, subscribeToTopic } from '../services/mqttService';
import redis from '../config/redis';
import { notifyStakeholders } from '../services/wsService';
import models from '../models';

export const startDeviceMonitoring = () => {

  subscribeToTopic('tele/+/SENSOR', async (topic, payload) => {
    const tasmotaId = topic.split('/')[1];
    console.log('Check here');
    try {
      const device = await models.Device.findOne({ where: { tasmotaId } });
      if (!device) return;
      const sensorData = JSON.parse(payload.toString());
      const energy = sensorData?.ENERGY?.Total || 0; // Energy in kWh
      await device.update({ energy }); // Store as kWh

      const orderKeys = await redis.keys('activeOrder:*');
      for (const key of orderKeys) {
        const orderData = JSON.parse((await redis.get(key)) || '{}');
        if (orderData.deviceId === device.dataValues.id && orderData.conditionType === 'energy_consumption') {
          if (energy >= orderData.conditionValue) {
            await stopOrder(orderData.orderId, 'Energy consumption limit reached');
          }
        }
      }
    } catch (error) {
      console.error('Error processing SENSOR message:', error);
    }
  });

  subscribeToTopic('tele/+/LWT', async (topic, payload) => {
    const tasmotaId = topic.split('/')[1];
    try {
      const device = await models.Device.findOne({ where: { tasmotaId } });
      if (!device) return;

      const status = payload.toString();
      if (status === 'Offline') {
        const orderKeys = await redis.keys('activeOrder:*');
        for (const key of orderKeys) {
          const orderData = JSON.parse((await redis.get(key)) || '{}');
          if (orderData.deviceId === device.dataValues.id) {
            await handlePowerLoss(orderData);
          }
        }
      }
    } catch (error) {
      console.log('ERROR 51', error)
    }

  });

  subscribeToTopic('tele/+/STATE', async (topic, payload) => {
    const tasmotaId = topic.split('/')[1];


    try {
      const device = await models.Device.findOne({ where: { tasmotaId } });
      if (!device) return;
      const stateData = JSON.parse(payload.toString());
      const powerState = stateData?.POWER || 'UNKNOWN';
      const orderKeys = await redis.keys('activeOrder:*');
      for (const key of orderKeys) {
        const orderData = JSON.parse((await redis.get(key)) || '{}');
        if (orderData.deviceId === device.dataValues.id) {
          const order = await models.Order.findByPk(orderData.orderId);
          if (!order || order.dataValues.completedTime) continue;

          if (powerState === 'OFF' && !order.dataValues.completedTime) {
            if (orderData.conditionType === 'energy_consumption') {
              await stopOrder(orderData.orderId, 'Order completed due to energy consumption limit (device rule).');
            } else {
              await handlePowerLoss(orderData);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing STATE message:', error);
    }
  });
};

const stopOrder = async (orderId: number, reason: string) => {
  try {
    const order = await models.Order.findByPk(orderId);
    if (!order || order.dataValues.completedTime) return;

    const device = await models.Device.findByPk(order.dataValues.deviceId);
    if (device) {
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/POWER${order.dataValues.relay || 1}`, 'OFF');
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '');
    }

    order.set('completedTime', new Date());
    await order.save();
    await redis.del(`activeOrder:${orderId}`);
    await notifyStakeholders(order, reason);
  } catch (error) {
    console.log('ERROR 103', error);

  }

};

const handlePowerLoss = async (orderData: any) => {
  try {
    const order = await models.Order.findByPk(orderData.orderId);
    if (!order || order.dataValues.completedTime) return;

    const device = await models.Device.findByPk(orderData.deviceId);
    if (!device) return;

    let compensation = 0;
    if (orderData.conditionType === 'time_duration') {
      const elapsed = (Date.now() - orderData.startedTime) / (60 * 1000);
      compensation = orderData.conditionValue - elapsed;
    } else if (orderData.conditionType === 'energy_consumption') {
      compensation = orderData.conditionValue - (device.dataValues.energy || 0);
    }

    if (compensation > 0) {
      const compensationData = {
        orderId: order.dataValues.id,
        userUuid: order.dataValues.userUuid,
        deviceId: order.dataValues.deviceId,
        compensationValue: compensation,
        conditionType: orderData.conditionType,
      };
      await redis.set(`compensation:${order.dataValues.id}`, JSON.stringify(compensationData), 'EX', 7 * 24 * 60 * 60);
      await notifyStakeholders(order, `Compensation granted: ${compensation} ${orderData.conditionType === 'time_duration' ? 'minutes' : 'kWh'} due to power loss.`);
    }

    await stopOrder(order.dataValues.id, 'Device offline due to power loss');
  } catch (error) {
    console.log('ERROR 139', error)
  }

};