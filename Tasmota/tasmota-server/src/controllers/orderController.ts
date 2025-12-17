import { Request, Response } from 'express';
import { SchedulePackage } from '../models/schedulePackage';

import { Op, WhereOptions } from 'sequelize';
import redis from '../config/redis';
import { DEVICE_CACHE_PREFIX, publishMqttMessage } from '../services/mqttService';
import { notifyStakeholders } from '../services/wsService';
import { generateQR } from '../services/lakService';
import models from '../models';
import { WS_HMVending } from '../services/userManagerService';
import { notilaabx_smartcb } from '../services/notificationService';

export const testOrder = async (req: Request, res: Response) => {
  const { packageId, deviceId, relay = 1 } = req.body;
  const user = res.locals.user;
  console.log('testOrder1111', req.body);

  try {
    const schedulePackage = await SchedulePackage.findByPk(packageId);
    if (!schedulePackage) {
      return res.status(404).json({ error: 'Package not found' });
    }
    const device = await models.Device.findByPk(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const order = await models.Order.create({
      uuid: `order-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      deviceId,
      packageId,
      userUuid: user.uuid,
      relay,
    } as any);



    const ordersD = (await findActiveOrderByDeviceId(deviceId)) as Array<any>;
    if (ordersD.length) {
      ordersD.forEach(v => {
        const key = `activeOrder:${v?.orderId}`;
        redis.del(key)
      })
    }
    // close exist Order
    await closeActiveOrder(deviceId);


    order.set('paidTime', new Date());
    // order.set('data', data);
    order.set('startedTime', new Date());
    await order.save();
    // check if device isActive? return 'want to buy more?' : next

    // if (!device?.dataValues?.energy) {
    //   return res.status(404).json({ error: 'Device energy not found' });
    // }

    // Clear existing rule and timer
    // await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '');
    // await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, '');

    await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '0');
    await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '');
    await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, '0');
    await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, '');

    // const current_energy = await redis.get(`${DEVICE_CACHE_PREFIX}${device.dataValues.tasmotaId}`);
    // if(current_energy){

    // }

    let newconditionValue = 0;

    if (schedulePackage.dataValues.conditionType === 'energy_consumption') {
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/EnergyReset`, '0');
      const rule = `ON Energy#Total>${(schedulePackage.dataValues.conditionValue / 1000) + (device?.dataValues?.energy || 0)} DO Power${order.dataValues.relay || 1} OFF ENDON`;
      // const rule = `ON Energy#Total>${schedulePackage.dataValues.conditionValue} DO Power${order.dataValues.relay || 1} OFF ENDON`;
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, rule);
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '1');

      newconditionValue = (device.dataValues.energy || 0) + (schedulePackage.dataValues.conditionValue / 1000)
      const updateNewconditionValue = await order.update({
        conditionValue: newconditionValue
      });
      console.log('updateNewconditionValue', updateNewconditionValue.toJSON());


    } else if (schedulePackage.dataValues.conditionType === 'time_duration') {
      const minutes = Math.ceil(schedulePackage.dataValues.conditionValue);
      const timer = `{"Enable":1,"Mode":0,"Time":"0:${minutes}","Action":0}`;
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, timer);

      newconditionValue = minutes
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

export const findAllActiveDevices = async (req: Request, res: Response) => {
  console.log('findAllActiveDevices==========');
  try {

    let data: any = []
    const keys = await redis.keys("deviceID:*");
    for (const key of keys) {
      const value = await redis.get(key);
      console.log(key, value);
      if (value) {
        const a = JSON.parse(value)
        data.push({ key: key, value: a.deviceId, time: a.time, paid: a.paid ? a.paid : false })
      }
    }

    return res.json({ data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to findAllActiveDevices' });
  }
};

export const deleteActiveDevice = async (req: Request, res: Response) => {
  console.log('deleteActiveDevice==========');
  try {
    const { deviceID } = req.body
    if (deviceID) {
      redis.del(`deviceID:${deviceID}`)
    } else {
      const keys = await redis.keys("deviceID:*");
      for (const key of keys) {
        const value = await redis.get(key);
        console.log(key, value);
        if (value) {
          redis.del(key)
        }
      }
    }

    return res.json({ status: 1 });
  } catch (error) {
    console.log('deleteActiveDeviceERROR==========');
    res.status(500).json({ error: (error as Error).message || 'Failed to findAllActiveDevices' });
  }
};
export const createOrderHMVending = async (req: Request, res: Response) => {
  const { packageId, deviceId, relay = 1 } = req.body;
  const user = res.locals.user;
  console.log('createOrderHMVending==========', req.body);

  try {

    const activeDevice = await redis.get(`deviceID:${deviceId}`)
    console.log('createOrderHMVending==========000', activeDevice);

    if (activeDevice) {
      return res.status(403).json({ error: 'device still using!' });
    }

    const schedulePackage = await SchedulePackage.findByPk(packageId);
    console.log('schedulePackage', schedulePackage);
    if (!schedulePackage) {
      return res.status(404).json({ error: 'Package not found' });
    }
    const device = await models.Device.findByPk(deviceId);
    console.log('device', device);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const order = await models.Order.create({
      uuid: `order-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      deviceId,
      packageId,
      userUuid: user.uuid,
      relay,
    } as any);

    const qr = await generateQR(order.dataValues.id, schedulePackage.dataValues.price, req.headers['token'] + '', true);
    console.log('createOrderHMVending==========111', qr);

    // await redis.setex(`qr:${qr}`, 5 * 60, order.dataValues.id.toString());

    const token = req.headers['token'];
    // save vending token for use in api pay, key name use orderID
    await redis.setex(`orderID:${order.dataValues.id}`, 5 * 60, token + '');
    // save deviceID for not allow other user create new order use this deivce
    const active_device_data = { deviceId, time: new Date() }
    await redis.setex(`deviceID:${deviceId}`, 3 * 60, JSON.stringify(active_device_data));

    return res.json({ qr, data: { order } });
  } catch (error) {
    console.log('createOrderHMVendingERROR', error);

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

    const activeDevice = await redis.get(`deviceID:${deviceId}`)
    if (activeDevice) {
      return res.status(403).json({ error: 'device still using!' });
    }

    const schedulePackage = await SchedulePackage.findByPk(packageId);
    if (!schedulePackage) {
      return res.status(404).json({ error: 'Package not found' });
    }
    const device = await models.Device.findByPk(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const order = await models.Order.create({
      uuid: `order-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      deviceId,
      packageId,
      userUuid: user.uuid,
      relay,
    } as any);

    const token = req.headers.authorization?.split(' ')[1];
    const qr = await generateQR(order.dataValues.id, schedulePackage.dataValues.price, token || '');
    console.log('createOrder==========111', qr);

    // save user token for use in api pay, key name use orderID_laabxapp
    await redis.setex(`orderID_laabxapp:${order.dataValues.id}`, 5 * 60, token + '');
    // save deviceID for not allow other user create new order use this deivce
    const active_device_data = { deviceId, time: new Date() }
    await redis.setex(`deviceID:${deviceId}`, 3 * 60, JSON.stringify(active_device_data));

    // await redis.setex(`qr:${qr}`, 5 * 60, order.dataValues.id.toString());
    return res.json({ qr, data: { order } });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to create order' });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  const user = res.locals.user;
  const query = req.query['q']
  try {

    let whereCondition: WhereOptions<any> = {}
    if (query == 'complete') {
      whereCondition = {
        startedTime: { [Op.ne]: null },
        userUuid: user.uuid,
        completedTime: { [Op.ne]: null },
      };
    } else {
      whereCondition = {
        startedTime: { [Op.ne]: null },
        userUuid: user.uuid,
        completedTime: { [Op.is]: null },
      };
    }


    const orders = await models.Order.findAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch orders' });
  }
};

export const getActiveOrdersByDeviceID = async (req: Request, res: Response) => {
  const user = res.locals.user;
  try {
    const id = Number(req.params.id + '') || -1;
    if (!id) {
      return res.status(403).json({ error: 'id not found' })
    }
    const whereCondition: WhereOptions<any> = {
      deviceId: id,
      completedTime: { [Op.is]: null },
      startedTime: { [Op.ne]: null },
    };

    const orders = await models.Order.findAll({
      where: whereCondition,
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
    const order = await models.Order.findOne({
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

export const getOrderByIdHMVending = async (req: Request, res: Response) => {

  const id = Number(req.params.id) || -1;

  try {
    const order = await models.Order.findOne({
      where: { id },
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
    console.log('payOrder ==========', req.body);

    const order = await models.Order.findByPk(Number(orderID));
    if (!order) {
      return res.status(403).json({ error: 'Order not found' });
    }

    const deviceId = order.dataValues.deviceId;
    const device = await models.Device.findByPk(deviceId);
    if (!device) {
      return res.status(403).json({ error: 'Device not found' });
    }

    const tasmotaId = device.dataValues.tasmotaId;
    const relay = order.dataValues.relay || 1;
    const existingEnergy = device.dataValues.energy || 0; // accumulated kWh from previous uses

    const schedulePackage = await SchedulePackage.findByPk(order.dataValues.packageId);
    if (!schedulePackage) {
      return res.status(403).json({ error: 'Package not found' });
    }

    // === Close any existing active orders on this device ===
    const activeOrders = await findActiveOrderByDeviceId(deviceId);
    if (activeOrders.length > 0) {
      for (const activeOrder of activeOrders) {
        await redis.del(`activeOrder:${activeOrder.orderId}`);
      }
    }
    await closeActiveOrder(deviceId);

    // === Update device lock in Redis (mark as active/paid) ===
    const keyDevice = `deviceID:${deviceId}`;
    await redis.del(keyDevice); // Clear any old lock
    const activeDeviceData = { deviceId, time: new Date(), paid: true };
    await redis.set(keyDevice, JSON.stringify(activeDeviceData));

    // === Mark order as paid and started ===
    order.set('paidTime', new Date());
    order.set('data', data);
    order.set('startedTime', new Date());
    await order.save();

    // === Clear previous rules and timers ===
    await publishMqttMessage(`cmnd/${tasmotaId}/Rule1`, '0'); // Disable
    await publishMqttMessage(`cmnd/${tasmotaId}/Rule1`, '');  // Clear
    await publishMqttMessage(`cmnd/${tasmotaId}/Timer1`, '0'); // Disable
    await publishMqttMessage(`cmnd/${tasmotaId}/Timer1`, '');  // Clear

    let appliedConditionValue = 0; // Will store the effective limit (kWh or minutes)

    // === Apply condition based on package type ===
    if (schedulePackage.dataValues.conditionType === 'energy_consumption') {
      // User/package defines limit in kWh → use directly
      const packageLimitKwh = Number(schedulePackage.dataValues.conditionValue);

      // Reset energy counter to start fresh
      await publishMqttMessage(`cmnd/${tasmotaId}/EnergyReset`, '0');

      // Total threshold = package allowance + any previously accumulated energy
      const thresholdKwh = packageLimitKwh + existingEnergy;

      const rule = `ON Energy#Total>${thresholdKwh} DO Power${relay} OFF ENDON`;

      await publishMqttMessage(`cmnd/${tasmotaId}/Rule1`, rule);
      await publishMqttMessage(`cmnd/${tasmotaId}/Rule1`, '1'); // Enable

      appliedConditionValue = thresholdKwh; // Store effective total limit

      console.log(`Energy rule set: Power${relay} OFF when Total > ${thresholdKwh} kWh`);
    } 
    else if (schedulePackage.dataValues.conditionType === 'time_duration') {
      // conditionValue is in minutes
      const minutes = Math.ceil(Number(schedulePackage.dataValues.conditionValue));

      const timer = `{"Enable":1,"Mode":0,"Time":"0:${minutes}","Action":0}`;
      await publishMqttMessage(`cmnd/${tasmotaId}/Timer1`, timer);

      appliedConditionValue = minutes;

      console.log(`Timer set: Power${relay} OFF after ${minutes} minutes`);
    }

    // === Save the applied condition value to order (for tracking) ===
    await order.update({ conditionValue: appliedConditionValue });

    // === Turn ON the relay ===
    const powerTopic = `cmnd/${tasmotaId}/POWER${relay === 1 ? '' : relay}`;
    await publishMqttMessage(powerTopic, 'ON');
    console.log(`Relay ON: ${powerTopic} -> ON`);

    // === Save active order details to Redis ===
    const orderDetails = {
      orderId: order.dataValues.id,
      deviceId: order.dataValues.deviceId,
      tasmotaId: device.dataValues.tasmotaId,
      packageId: order.dataValues.packageId,
      conditionType: schedulePackage.dataValues.conditionType,
      conditionValue: appliedConditionValue,
      startedTime: order.dataValues.startedTime.getTime(),
      relay: relay,
    };

    await redis.set(
      `activeOrder:${order.dataValues.id}`,
      JSON.stringify(orderDetails),
      'EX',
      24 * 60 * 60 // 24 hours expiry
    );

    console.log(`Active order saved in Redis: activeOrder:${order.dataValues.id}`);

    // === Notify vending machine via WebSocket (if connected) ===
    const token_vending = await redis.get(`orderID:${order.dataValues.id}`);
    if (token_vending) {
      await WS_HMVending(token_vending, orderDetails);
    }

    // === Notify user app via push/WebSocket ===
    const token_user = await redis.get(`orderID_laabxapp:${order.dataValues.id}`);
    const datanoti = { callback: 'true', orderDetails };
    const noti = await notilaabx_smartcb(datanoti, token_user || '');
    console.log('notilaabx_smartcb result:', noti);

    return res.json({ message: 'Order paid and device activated', order: orderDetails });
  } catch (error: any) {
    console.error('payOrder error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to process order payment' 
    });
  }
};

export const completeOrder = async (req: Request, res: Response) => {
  const { deviceId } = req.body;

  try {
    const order = await models.Order.findOne({
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
    const device = await models.Device.findByPk(order.dataValues.deviceId);
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

export async function findActiveOrderIds() {
  const orderKeys = await redis.keys('activeOrder:*');
  const ordersData = await Promise.all(
    orderKeys.map(async (key) => ({
      key,
      data: JSON.parse((await redis.get(key)) || '{}'),
    }))
  );
  const orderIds = ordersData
    .filter(({ data }) => data.orderId)
    .map(({ data }) => data.orderId);

  return orderIds
}

export const findActiveOrderByDeviceId = async (deviceId: number = -1) => {
  const orderIds = await findActiveOrderIds()
  const whereCondition2: WhereOptions<any> = {
    id: { [Op.in]: orderIds },
    completedTime: { [Op.is]: null }
  };

  const orders = await models.Order.findAll({
    where: whereCondition2
  });
  const deviceIds = orders.map(v => { return { deviceId: v.dataValues.deviceId, orderId: v.dataValues.id, packageId: v.dataValues.packageId } })
  return deviceId != -1 ? deviceIds.filter(v => v.deviceId == deviceId) : deviceIds;
}
export const closeActiveOrder = async (deviceId: number = -1) => {

  const order = await models.Order.findOne({ where: { id: deviceId } });
  order?.set('completedTime', new Date());
  return await order?.save();
}
