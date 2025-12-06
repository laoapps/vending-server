import { cleanEnv, str } from 'envalid';

export const env = cleanEnv(process.env, {
  DATABASE_URL: str(),
  JWT_SECRET: str(),
  MQTT_BROKER: str(),
  MQTT_WS_URL: str(),
  MQTT_USERNAME: str(),
  MQTT_PASSWORD: str(),
  USERMANAGER_URL: str(),
  BACKEND_KEY: str(),
  SERVICE_NAME: str(),
  REDIS_URL: str({ default: 'redis://localhost:6379' }),
});