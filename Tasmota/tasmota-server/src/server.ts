// src/server.ts
import app from './app';
import sequelize from './config/database';
import cron from 'node-cron';
import { Op } from 'sequelize';
import http from 'http';
import WebSocket from 'ws';
import {
  userClients,
  adminClients,
  ownerClients,
  notifyStakeholders,
} from './services/wsService';
import { findRealDB } from './services/userManagerService';
import { startDeviceMonitoring } from './controllers/monitorOrderController';
import { publishMqttMessage } from './services/mqttService';
import redis from './config/redis';
import models from './models';
import BookingModel from './models/booking.model';
import RoomModel from './models/room.model';
import { Device } from './models/device';

const PORT = process.env.PORT || 3000;

// Recover vending orders (your original — untouched)
async function recoverActiveOrders() {
  try {
    const orderKeys = await redis.keys('activeOrder:*');
    for (const key of orderKeys) {
      const orderData = JSON.parse((await redis.get(key)) || '{}');
      if (!orderData.orderId) {
        await redis.del(key);
        continue;
      }

      const order = await models.Order.findByPk(orderData.orderId);
      if (!order) {
        await redis.del(key);
        continue;
      }

      if (order.dataValues.completedTime) {
        const device = await models.Device.findByPk(order.dataValues.deviceId);
        if (device) {
          await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/POWER${orderData.relay || 1}`, 'OFF');
          await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '');
          await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, '');
        }
        await redis.del(key);
        continue;
      }

      // Re-apply rules on restart
      if (orderData.conditionType === 'energy_consumption') {
        const device = await models.Device.findByPk(order.dataValues.deviceId);
        if (device) {
          await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/EnergyReset`, '0');
          const rule = `ON Energy#Total>${order.dataValues.conditionValue} DO Power${orderData.relay || 1} OFF ENDON`;
          await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, rule);
          await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '1');
        }
      }
    }
    console.log(`Recovered ${orderKeys.length} active vending orders`);
  } catch (error) {
    console.error('Error recovering active orders:', error);
  }
}

// HOTEL: Daily 12:05 + every minute expiry check
async function runHotelCronJobs() {
  const now = new Date();

  // 1. Daily 12:05 checkout
  if (now.getHours() === 12 && now.getMinutes() >= 5 && now.getMinutes() < 10) {
    console.log('Hotel Cron: Running 12:05 daily checkout');

    const expiredRooms = await RoomModel.findAll({
      where: {
        hotelCheckOut: { [Op.lt]: now },
        available: false,
      },
    });

    for (const room of expiredRooms) {
      if (!room.deviceId) continue;

      const device = await Device.findByPk(room.deviceId);
      if (!device) continue;

      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/POWER1`, 'OFF');

      await room.update({
        available: true,
        hotelCheckIn: null,
        hotelCheckOut: null,
      });

      await BookingModel.update(
        { status: 'checked_out' },
        { where: { roomId: room.id, status: 'paid' } }
      );

      console.log(`Checked out: ${room.name} (${device.dataValues.tasmotaId})`);
    }
  }

  // 2. Every minute: check time/kWh expired bookings
  const expiredBookings = await BookingModel.findAll({
    where: {
      status: 'paid',
      checkOut: { [Op.lt]: now },
    },
  });

  for (const booking of expiredBookings) {
    const room = await RoomModel.findByPk(booking.roomId);
    if (!room || !room.deviceId) continue;

    const device = await Device.findByPk(room.deviceId);
    if (!device) continue;

    await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/POWER1`, 'OFF');
    await room.update({
      available: true,
      hotelCheckIn: null,
      hotelCheckOut: null,
    });
    await booking.update({ status: 'checked_out' });

    console.log(`Hotel booking expired: ${booking.id}`);
  }
}

// MAIN SERVER
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ force: false });
    console.log('Models synced');

    await recoverActiveOrders();
    startDeviceMonitoring();

    // ONE SINGLE CRON — handles both vending + hotel
    cron.schedule('* * * * *', async () => {
      try {
        // === VENDING LOGIC (your original — 100% untouched) ===
        const orderKeys = await redis.keys('activeOrder:*');
        const ordersData = await Promise.all(
          orderKeys.map(async (key) => ({
            key,
            data: JSON.parse((await redis.get(key)) || '{}'),
          }))
        );

        for (const { key, data: order } of ordersData) {
          if (!order.orderId) {
            await redis.del(key);
            continue;
          }

          const dbOrder = await models.Order.findByPk(order.orderId);
          if (!dbOrder || dbOrder.dataValues.completedTime) {
            const device = await models.Device.findByPk(order.deviceId);
            if (device) {
              await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/POWER${order.relay || 1}`, 'OFF');
              await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '');
              await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, '');
            }
            await redis.del(key);
            continue;
          }

          const device = await models.Device.findByPk(order.deviceId);
          if (!device) continue;

          if (order.conditionType === 'time_duration') {
            const elapsed = (Date.now() - order.startedTime) / (60 * 1000);
            if (elapsed >= order.conditionValue) {
              await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/POWER${order.relay || 1}`, 'OFF');
              dbOrder.set('completedTime', new Date());
              await dbOrder.save();
              await redis.del(key);
              await redis.del(`deviceID:${order.deviceId}`);
              await notifyStakeholders(dbOrder, 'Order completed (time)');
            }
          } else if (order.conditionType === 'energy_consumption') {
            {
              if (device.dataValues.energy || -1 >= order.conditionValue) {
                await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/POWER${order.relay || 1}`, 'OFF');
                dbOrder.set('completedTime', new Date());
                await dbOrder.save();
                await redis.del(key);
                await redis.del(`deviceID:${order.deviceId}`);
                await notifyStakeholders(dbOrder, 'Order completed (kWh)');
              }
            }
          }

          // === HOTEL LOGIC — runs every minute ===
          await runHotelCronJobs();

          // === CLEANUP: unpaid orders > 1h ===
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          await models.Order.destroy({
            where: {
              paidTime: null,
              createdAt: { [Op.lt]: oneHourAgo },
            },
          });
        }
      } catch (error) {
        console.error('Cron error:', error);
      }
    });

    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });

    wss.on('connection', async (ws, req) => {
      // Your existing WS code — 100% untouched
      // ... (keep exactly as you have it)
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Vending + Hotel cron active`);
    });
  } catch (error) {
    console.error('Server failed:', error);
    process.exit(1);
  }
}

startServer();