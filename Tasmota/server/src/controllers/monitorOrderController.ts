import { Op } from 'sequelize';
import { Order } from '../models/order';
import { Device } from '../models/device';
import { SchedulePackage } from '../models/schedulePackage';
import { publishMqttMessage, subscribeToTopic } from '../services/mqttService';
import redis from '../config/redis';
import { notifyStakeholders } from '../services/wsService';

export const startDeviceMonitoring = () => {
  // Subscribe to Tasmota SENSOR topic for energy consumption
  subscribeToTopic('tele/+/SENSOR', async (topic, payload) => {
    const tasmotaId = topic.split('/')[1];
    const device = await Device.findOne({ where: { tasmotaId } });
    if (!device) return;

    try {
      const sensorData = JSON.parse(payload.toString());
      const energy = sensorData?.ENERGY?.Total || 0;
      await device.update({ energy });

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

  // Subscribe to Tasmota LWT topic for device status
  subscribeToTopic('tele/+/LWT', async (topic, payload) => {
    const tasmotaId = topic.split('/')[1];
    const device = await Device.findOne({ where: { tasmotaId } });
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
  });

  // Subscribe to Tasmota STATE topic to verify power state
  subscribeToTopic('tele/+/STATE', async (topic, payload) => {
    const tasmotaId = topic.split('/')[1];
    const device = await Device.findOne({ where: { tasmotaId } });
    if (!device) return;

    try {
      const stateData = JSON.parse(payload.toString());
      const powerState = stateData?.POWER || 'UNKNOWN';
      const orderKeys = await redis.keys('activeOrder:*');
      for (const key of orderKeys) {
        const orderData = JSON.parse((await redis.get(key)) || '{}');
        if (orderData.deviceId === device.dataValues.id) {
          const order = await Order.findByPk(orderData.orderId);
          if (!order || order.dataValues.completedTime) continue;

          if (powerState === 'OFF' && !order.dataValues.completedTime) {
            await handlePowerLoss(orderData);
          }
        }
      }
    } catch (error) {
      console.error('Error processing STATE message:', error);
    }
  });
};

const stopOrder = async (orderId: number, reason: string) => {
  const order = await Order.findByPk(orderId);
  if (!order || order.dataValues.completedTime) return;

  const device = await Device.findByPk(order.dataValues.deviceId);
  if (device) {
    await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/POWER${order.dataValues.relay || 1}`, 'OFF');
  }

  order.dataValues.completedTime = new Date();
  await order.save();
  await redis.del(`activeOrder:${orderId}`);
  await notifyStakeholders(order, reason);
};

const handlePowerLoss = async (orderData: any) => {
  const order = await Order.findByPk(orderData.orderId);
  if (!order || order.dataValues.completedTime) return;

  const device = await Device.findByPk(orderData.deviceId);
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
};