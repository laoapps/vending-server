import mqtt from 'mqtt';
import { env } from '../config/env';

const client = mqtt.connect(env.MQTT_BROKER, {
  username: env.MQTT_USERNAME,
  password: env.MQTT_PASSWORD,
  clientId: `smartcb_api_${Math.random().toString(16).slice(3)}`,
});

client.on('connect', () => {
  console.log(`Connected to MQTT broker ${env.MQTT_BROKER} with username: ${env.MQTT_USERNAME}`);
  client.subscribe('tele/+/LWT', (err) => {
    if (err) console.error('Failed to subscribe to LWT:', err);
    else console.log('Subscribed to tele/+/LWT');
  });
  client.subscribe('tele/+/SENSOR', (err) => {
    if (err) console.error('Failed to subscribe to SENSOR:', err);
    else console.log('Subscribed to tele/+/SENSOR');
  });
});

client.on('error', (err) => {
  console.error('MQTT error:', err);
});

client.on('close', () => {
  console.warn('MQTT connection closed');
});

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
      console.log(`Received message on ${receivedTopic}: ${payload.toString()}`);
      callback(receivedTopic, payload);
    }
  });
};