import mqtt from 'mqtt';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { monitorConditions } from './scheduleService';

const client = mqtt.connect(env.MQTT_BROKER, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
});

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe(['stat/#', 'tele/#'], (err) => {
    if (err) console.error('Subscription error:', err);
  });
});

client.on('message', async (topic, message) => {
  if (topic.startsWith('stat/')) {
    const tasmotaId = topic.split('/')[1];
    const status = JSON.parse(message.toString());

    const prisma = new PrismaClient();
    await prisma.device.update({
      where: { tasmotaId },
      data: { status },
    });
  } else if (topic.startsWith('tele/')) {
    await monitorConditions(topic, message);
  }
});

export const publishMqttMessage = (topic: string, message: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    client.publish(topic, message, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};