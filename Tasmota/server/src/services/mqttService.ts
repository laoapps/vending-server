import mqtt from 'mqtt';
import { env } from '../config/env';
import { Device } from '../models/device';

import redis from '../config/redis';

// Initialize Redis client


// Redis key prefix for device data
export const DEVICE_CACHE_PREFIX = 'device:';
export const CACHE_TTL = 3600; // Cache TTL in seconds (1 hour)

// MQTT client setup
const client = mqtt.connect(env.MQTT_BROKER, {
  username: env.MQTT_USERNAME,
  password: env.MQTT_PASSWORD,
  clientId: `smartcb_api_${Math.random().toString(16).slice(3)}`,
});

client.on('connect', () => {
  console.log(`Connected to MQTT broker ${env.MQTT_BROKER} with username: ${env.MQTT_USERNAME}`);
  subscribeToTopic('tele/+/LWT', lwtCallback);
  subscribeToTopic('tele/+/SENSOR', sensorCallback);
});

client.on('error', (err) => {
  console.error('MQTT error:', err);
});

client.on('close', () => {
  console.warn('MQTT connection closed');
});

// Helper function to get device data from Redis
export const getDeviceFromCache = async (tasmotaId: string) => {
  const data = await redis.get(`${DEVICE_CACHE_PREFIX}${tasmotaId}`);
  return data ? JSON.parse(data) : null;
};

// Helper function to set device data in Redis
const setDeviceInCache = async (tasmotaId: string, data: any) => {
  await redis.setex(
    `${DEVICE_CACHE_PREFIX}${tasmotaId}`,
    CACHE_TTL,
    JSON.stringify(data)
  );
};

// Publish MQTT message
export const publishMqttMessage = async (topic: string, payload: string) => {
  return new Promise<void>((resolve, reject) => {
    console.log(`Publishing to topic: ${topic}, payload: ${payload}`);
    client.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error(`Failed to publish to ${topic}:`, err);
        reject(err);
      } else {
        console.log(`Published successfully to ${topic} with payload: ${payload}`);
        resolve();
      }
    });
  });
};

// Subscribe to MQTT topic
export const subscribeToTopic = (topic: string, callback: (receivedTopic: string, payload: Buffer) => void) => {
  client.subscribe(topic, (err) => {
    if (err) {
      console.error(`Failed to subscribe to ${topic}:`, err);
    } else {
      console.log(`Subscribed to ${topic}`);
    }
  });
  client.on('message', (receivedTopic, payload) => {
    if (receivedTopic.startsWith(topic.split('+')[0])) {
      console.log(`Received message on ${receivedTopic}: ${payload.toString()}`);
      callback(receivedTopic, payload);
    }
  });
};

// Callback for LWT - Update device status to online/offline
const lwtCallback = async (receivedTopic: string, payload: Buffer) => {
  const tasmotaId = receivedTopic.split('/')[1];

  // Check Redis cache first
  const cachedDevice = await getDeviceFromCache(tasmotaId);
  if (cachedDevice && cachedDevice.status?.connection === payload.toString()) {
    console.log(`Device ${tasmotaId} status unchanged in cache: ${payload.toString()}`);
    return;
  }

  // Update database
  const device = await Device.findOne({ where: { tasmotaId } });
  if (!device) {
    console.log(`Device ${tasmotaId} not found in database`);
    return;
  }

  const status = payload.toString();
  const newStatus = status === 'Online' ? 'online' : 'offline';
  await device.update({ status: { ...device.dataValues.status, connection: newStatus } });

  // Update Redis cache
  const updatedData = {
    // ...cachedDevice,
    tasmotaId,
    status: { ...device.dataValues.status, connection: newStatus },
    energy: device.dataValues.energy,
    power: device.dataValues.power,
  };
  await setDeviceInCache(tasmotaId, updatedData);

  console.log(`Updated device ${tasmotaId} status to ${newStatus} in database and cache`);
};

// Callback for SENSOR - Update device power and energy
const sensorCallback = async (receivedTopic: string, payload: Buffer) => {
  const tasmotaId = receivedTopic.split('/')[1];

  // Check Redis cache first
  const cachedDevice = await getDeviceFromCache(tasmotaId);

  // Parse sensor data
  let sensorData;
  try {
    sensorData = JSON.parse(payload.toString());
  } catch (error) {
    console.error(`Error parsing SENSOR data for device ${tasmotaId}:`, error);
    return;
  }

  const energy = sensorData?.ENERGY?.Total || 0;
  const power = sensorData?.ENERGY?.Power || 0;

  // Skip update if data hasn't changed
  if (cachedDevice && cachedDevice.energy === energy && cachedDevice.power === power) {
    console.log(`Device ${tasmotaId} sensor data unchanged in cache: energy=${energy}, power=${power}`);
    return;
  }

  // Update database
  const device = await Device.findOne({ where: { tasmotaId } });
  if (!device) {
    console.log(`Device ${tasmotaId} not found in database`);
    return;
  }

  await device.update({ energy, power });

  // Update Redis cache
  const updatedData = {
    // ...cachedDevice,
    tasmotaId,
    status: device.dataValues.status,
    energy,
    power,
  };
  await setDeviceInCache(tasmotaId, updatedData);

  console.log(`Updated device ${tasmotaId} energy to ${energy} and power to ${power} in database and cache`);
};

// Optional: Function to get device data (cached or from database)
export const getDeviceData = async (tasmotaId: string) => {
  // Try Redis first
  const cachedDevice = await getDeviceFromCache(tasmotaId);
  if (cachedDevice) {
    console.log(`Retrieved device ${tasmotaId} from cache`);
    return cachedDevice;
  }

  // Fallback to database
  const device = await Device.findOne({ where: { tasmotaId } });
  if (!device) {
    console.log(`Device ${tasmotaId} not found in database`);
    return null;
  }

  // Cache the database result
  const deviceData = {
    tasmotaId,
    status: device.dataValues.status,
    energy: device.dataValues.energy,
    power: device.dataValues.power,
  };
  await setDeviceInCache(tasmotaId, deviceData);

  console.log(`Retrieved device ${tasmotaId} from database and cached`);
  return deviceData;
};