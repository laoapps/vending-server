import mqtt from 'mqtt';
import { env } from '../config/env';

const client = mqtt.connect(env.MQTT_BROKER, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  clientId: `tasmota-${env.SERVICE_NAME}-${Math.random().toString(16).slice(2)}`,
});

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe('tele/+/LWT', (err) => {
    if (err) console.error('Failed to subscribe to LWT:', err);
  });
  client.subscribe('tele/+/SENSOR', (err) => {
    if (err) console.error('Failed to subscribe to SENSOR:', err);
  });
});

client.on('error', (err) => {
  console.error('MQTT error:', err);
});

export const publishMqttMessage = async (topic: string, payload: string) => {
  return new Promise<void>((resolve, reject) => {
    console.log(`Publishing to topic: ${topic}, payload: ${payload}`);
    client.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error(`Failed to publish to ${topic}:`, err);
        reject(err);
      } else {
        console.log(`Published successfully to ${topic}`);
        resolve();
      }
    });
  });
};

export const subscribeToTopic = (topic: string, callback: (topic: string, payload: Buffer) => void) => {
  client.subscribe(topic, (err) => {
    if (err) {
      console.error(`Failed to subscribe to ${topic}:`, err);
    } else {
      console.log(`Subscribed to ${topic}`);
    }
  });

  client.on('message', (receivedTopic, payload) => {
    if (receivedTopic.startsWith(topic)) {
      callback(receivedTopic, payload);
    }
  });
};