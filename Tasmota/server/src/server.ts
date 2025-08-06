import app from './app'; // Adjust import as per your setup
import sequelize from './config/database';
import { Umzug, SequelizeStorage } from 'umzug';
import cron from 'node-cron';
import { Op } from 'sequelize';
import { Order } from './models/order';
import WebSocket from 'ws';
import { userClients, adminClients, ownerClients } from './services/wsService';
import http from 'http';
import { findRealDB } from './services/userManagerService';
import { startDeviceMonitoring } from './controllers/monitorOrderController'; // Import monitoring
import {Device} from './models/device';
import { publishMqttMessage } from './services/mqttService';
import { notifyStakeholders } from './services/wsService';
import redis from './config/redis'; // Adjust import as per your setup
const PORT = process.env.PORT || 3000;

// Initialize migrations with Umzug
const umzug = new Umzug({
  migrations: {
    glob: 'migrations/*.js',
    resolve: ({ name, path: migrationPath }) => {
      const migration = require(migrationPath!);
      return {
        name,
        up: async () => migration.up(sequelize.getQueryInterface(), sequelize.Sequelize),
        down: async () => migration.down(sequelize.getQueryInterface(), sequelize.Sequelize),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

async function startServer() {
  try {
    // Start device monitoring
    startDeviceMonitoring();

    // Every 10 seconds for order monitoring
    cron.schedule('*/10 * * * * *', async () => {
      try {
        // Check active orders for time_duration limits
        const orderKeys = await redis.keys('activeOrder:*');
        for (const key of orderKeys) {
          const orderData = JSON.parse((await redis.get(key)) || '{}');
          if (!orderData.orderId) continue;

          const order = await Order.findByPk(orderData.orderId);
          if (!order || order.dataValues.completedTime) {
            await redis.del(key);
            continue;
          }

          if (orderData.conditionType === 'time_duration') {
            const elapsed = (Date.now() - orderData.startedTime) / (60 * 1000); // Minutes
            if (elapsed >= orderData.conditionValue) {
              const device = await Device.findByPk(orderData.deviceId);
              if (device) {
                await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/POWER${orderData.relay || 1}`, 'OFF');
              }
              order.dataValues.completedTime = new Date();
              await order.save();
              await redis.del(key);
              await notifyStakeholders(order, 'Order completed due to time duration limit.');
            }
          }
        }

        // Delete unpaid orders older than 1 hour
        const twentyFourHoursAgo = new Date(Date.now() - 60 * 60 * 1000);
        const deletedCount = await Order.destroy({
          where: {
            paidTime: '',
            createdAt: { [Op.lte]: twentyFourHoursAgo },
          },
        });

        if (deletedCount > 0) {
          console.log(`Deleted ${deletedCount} unpaid order(s)`);
        }
      } catch (error) {
        console.error('Error in cron job:', error);
      }
    });

    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Run migrations
    await umzug.up();
    console.log('Database migrations applied successfully.');

    // Start server
    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });

    wss.on('connection', async (ws, req) => {
      const url = new URL(req?.url || '', `http://${req.headers.host}`);
      const type = url.searchParams.get('type');
      const token = url.searchParams.get('token');
      const authenticatedId = await findRealDB(token || '');
      if (!type || !token) {
        ws.close(1008, 'Missing type or token');
        return;
      }
      if (!authenticatedId) {
        ws.close(1008, 'Invalid token');
        return;
      }

      if (type === 'user') {
        const userUuid = url.searchParams.get('uuid');
        if (userUuid && userUuid === authenticatedId) {
          if (!userClients.has(userUuid)) userClients.set(userUuid, new Set());
          userClients.get(userUuid)?.add({ WebSocket: ws, uuid: authenticatedId });
          ws.on('close', () => {
            userClients.get(userUuid)?.delete({ WebSocket: ws, uuid: authenticatedId });
            if (userClients.get(userUuid)?.size === 0) userClients.delete(userUuid);
          });
        } else {
          ws.close(1008, 'Unauthorized user UUID');
        }
      } else if (type === 'admin') {
        adminClients.add({ WebSocket: ws, uuid: authenticatedId });
        ws.on('close', () => adminClients.delete({ WebSocket: ws, uuid: authenticatedId }));
      } else if (type === 'owner') {
        const ownerId = parseInt(url.searchParams.get('id') || '');
        if (!isNaN(ownerId) && ownerId.toString() === authenticatedId) {
          if (!ownerClients.has(ownerId)) ownerClients.set(ownerId, new Set());
          ownerClients.get(ownerId)?.add({ WebSocket: ws, uuid: authenticatedId });
          ws.on('close', () => {
            ownerClients.get(ownerId)?.delete({ WebSocket: ws, uuid: authenticatedId });
            if (ownerClients.get(ownerId)?.size === 0) ownerClients.delete(ownerId);
          });
        } else {
          ws.close(1008, 'Unauthorized owner ID');
        }
      }
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();