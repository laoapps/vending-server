// src/server.ts — FINAL VERSION

import app from './app';
import sequelize from './config/database';
import cron from 'node-cron';
import { Op } from 'sequelize';
import http from 'http';
import WebSocket from 'ws';
import {
  notifyStakeholders,
} from './services/wsService';
import { startDeviceMonitoring } from './controllers/monitorOrderController';
import { publishMqttMessage } from './services/mqttService';
import redis from './config/redis';
import models from './models';
import { Device } from './models/device';
import RoomModel from './models/room.model';


const PORT = process.env.PORT || 3000;

// Cache keys
const ACTIVE_BOOKINGS_CACHE_KEY = 'cache:active_hotel_bookings';
const ACTIVE_ORDERS_CACHE_KEY = 'cache:active_vending_orders';
const CACHE_TTL_SECONDS = 300; // 5 minutes

// Types for cache
interface CachedHotelBooking {
  type: 'hotel';
  bookingId: number;
  roomName: string;
  checkOut: number; // timestamp
  deviceId: number;
}

interface CachedVendingOrder {
  type: 'vending';
  orderId: number;
  conditionType: 'time_duration' | 'energy_consumption';
  conditionValue: number;
  startedTime: number;
  relay: number;
  deviceId: number;
}

type ActiveCache = Record<string, CachedHotelBooking | CachedVendingOrder>;

// Helper: get tasmotaId with cache
async function getTasmotaId(deviceId: number): Promise<string> {
  const cacheKey = `device:tasmota:${deviceId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const device = await Device.findByPk(deviceId);
  const tasmotaId = device?.dataValues.tasmotaId || 'unknown';
  await redis.set(cacheKey, tasmotaId, 'EX', 3600);
  return tasmotaId;
}

// Recover active vending orders on startup
async function recoverActiveOrders() {
  try {
    const orderKeys = await redis.keys('activeOrder:*');
    console.log(`Recovering ${orderKeys.length} active vending orders...`);

    for (const key of orderKeys) {
      const orderData = JSON.parse((await redis.get(key)) || '{}');
      if (!orderData.orderId || !orderData.deviceId) {
        await redis.del(key);
        continue;
      }

      const order = await models.Order.findByPk(orderData.orderId);
      if (!order || order.dataValues.completedTime) {
        const device = await Device.findByPk(orderData.deviceId);
        if (device) {
          await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/POWER${orderData.relay || 1}`, 'OFF');
          await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '');
          await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, '');
        }
        await redis.del(key);
        continue;
      }

      // Re-apply energy rule if needed
      if (orderData.conditionType === 'energy_consumption') {
        const device = await Device.findByPk(orderData.deviceId);
        if (device) {
          await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/EnergyReset`, '0');
          const rule = `ON Energy#Total>${orderData.dataValues.conditionValue} DO Power${orderData.relay || 1} OFF ENDON`;
          await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, rule);
          await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '1');
        }
      }
    }
    console.log('Vending recovery complete');
  } catch (error) {
    console.error('Error recovering vending orders:', error);
  }
}

// Refresh active cache every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Refreshing active bookings/orders cache...');
  try {
    // Hotel bookings
    const activeBookings = await models.Booking.findAll({
      where: {
        status: 'paid',
        checkOut: { [Op.gt]: new Date() }
      },
      include: [{ model: RoomModel,
      as: 'room',
      include: [
        {
          model: models.Location,
          as: 'location'
        }
      ],
       attributes: ['id', 'deviceId', 'name'] }]
    });

    const hotelMap: Record<string, CachedHotelBooking> = {};
    for (const b of activeBookings) {
      if (b.dataValues.Room?.deviceId) {
        hotelMap[b.dataValues.Room.deviceId] = {
          type: 'hotel',
          bookingId: b.id,
          roomName: b.dataValues.Room.name,
          checkOut: new Date(b.checkOut).getTime(),
          deviceId: b.dataValues.Room.deviceId
        };
      }
    }
    await redis.set(ACTIVE_BOOKINGS_CACHE_KEY, JSON.stringify(hotelMap), 'EX', CACHE_TTL_SECONDS);

    // Vending orders (from Redis)
    const orderKeys = await redis.keys('activeOrder:*');
    const vendingMap: Record<string, CachedVendingOrder> = {};
    for (const key of orderKeys) {
      const data = JSON.parse((await redis.get(key)) || '{}');
      if (data.deviceId && data.startedTime) {
        vendingMap[data.deviceId] = {
          type: 'vending',
          orderId: data.orderId,
          conditionType: data.conditionType,
          conditionValue: data.conditionValue,
          startedTime: data.startedTime,
          relay: data.relay || 1,
          deviceId: data.deviceId
        };
      }
    }
    await redis.set(ACTIVE_ORDERS_CACHE_KEY, JSON.stringify(vendingMap), 'EX', CACHE_TTL_SECONDS);

    console.log(`Cache refreshed: ${Object.keys(hotelMap).length} hotel, ${Object.keys(vendingMap).length} vending`);
  } catch (err) {
    console.error('Cache refresh failed:', err);
  }
});

// Main cron: runs every minute — uses cache only
cron.schedule('* * * * *', async () => {
  try {
    const now = Date.now();

    const [hotelCache, vendingCache] = await Promise.all([
      redis.get(ACTIVE_BOOKINGS_CACHE_KEY),
      redis.get(ACTIVE_ORDERS_CACHE_KEY)
    ]);

    const activeHotels: ActiveCache = hotelCache ? JSON.parse(hotelCache) : {};
    const activeVending: ActiveCache = vendingCache ? JSON.parse(vendingCache) : {};

    // Hotel expiry
    for (const [deviceIdStr, info] of Object.entries(activeHotels)) {
      const deviceId = Number(deviceIdStr);
      if (info.type === 'hotel' && info.checkOut < now) {
        const tasmotaId = await getTasmotaId(deviceId);
        await publishMqttMessage(`cmnd/${tasmotaId}/POWER1`, 'OFF');
        console.log(`Hotel booking expired: ${info.roomName} (ID: ${info.bookingId})`);
        // Optional: update DB status later in background
      }
    }

    // Vending time expiry
    for (const [deviceIdStr, info] of Object.entries(activeVending)) {
      const deviceId = Number(deviceIdStr);
      if (info.type === 'vending' && info.conditionType === 'time_duration') {
        const elapsedMin = (now - info.startedTime) / (60 * 1000);
        if (elapsedMin >= info.conditionValue) {
          const tasmotaId = await getTasmotaId(deviceId);
          await publishMqttMessage(`cmnd/${tasmotaId}/POWER${info.relay}`, 'OFF');
          await redis.del(`activeOrder:${info.orderId}`);
          console.log(`Vending order completed (time): ${info.orderId}`);
        }
      }
    }

    // Cleanup old pending bookings (10 min hold)
    const holdCutoff = new Date(now - 10 * 60 * 1000);
    const cancelledCount = await models.Booking.update(
      { status: 'cancelled', cancelledAt: new Date() },
      {
        where: {
          status: 'pending',
          createdAt: { [Op.lt]: holdCutoff }
        }
      }
    );
    if (cancelledCount[0] > 0) {
      console.log(`Cancelled ${cancelledCount[0]} old pending bookings`);
    }

  } catch (error) {
    console.error('Minute cron error:', error);
  }
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ alter: false });
    console.log('Models synced');

    await recoverActiveOrders();
    startDeviceMonitoring();

    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });

    wss.on('connection', async (ws, req) => {
      // Your existing WebSocket logic here (unchanged)
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Vending + Hotel cron system active with Redis caching');
    });
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
}

startServer();