
import Redis from 'ioredis';
import * as WebSocketServer from 'ws';
import { EMessage } from '../entities/system.model';

export interface AnomalyNotification {
  id: string;
  machineId: string;
  type: NotificationType;
  message: string;
  severity: 'warning' | 'critical';
  data?: any;
  createdAt: Date;
}

export enum NotificationType {
  HIGH_TEMP_SUSTAINED = 'HIGH_TEMP_SUSTAINED',
  COMPRESSOR_NEVER_STOPS = 'COMPRESSOR_NEVER_STOPS',
  // You can add more types later
}

export class AnomalyDetector {
  private redisClient: Redis;

  private emitToAdmins: (uuid: string , wss: WebSocketServer.Server, comm: string, d: any, delay: boolean) => void;
  private notificationService?: (notification: AnomalyNotification) => Promise<void>;
  private wss: WebSocketServer.Server;

  constructor(
    wss: WebSocketServer.Server,
    redisClient: Redis,
    emitToAdmins: (uuid: string , wss: WebSocketServer.Server, comm: string, d: any, delay: boolean ) => void,
    notificationService?: (notification: AnomalyNotification) => Promise<void>
  ) {
    this.wss = wss;
    this.redisClient = redisClient;
    this.emitToAdmins = emitToAdmins;
    this.notificationService = notificationService;
  }

  /**
   * Main function to check temperature anomaly
   */
  public async checkTemperatureAnomaly(machineId: string, currentTemp: number): Promise<void> {
    const key = `temp_history:${machineId}`;
    const now = new Date();

    // 1. Save current temperature to Redis (keep last ~1 hour)
    await this.redisClient.lpush(key, JSON.stringify({ temp: currentTemp, time: now.toISOString() }));
    await this.redisClient.ltrim(key, 0, 360); // Keep last 360 entries (~1 hour if every 10s)
    await this.redisClient.expire(key, 3600);

    // 2. Get recent history
    const historyRaw = await this.redisClient.lrange(key, 0, -1);
    if (historyRaw.length < 30) return; // Not enough data

    const temps = historyRaw.map(item => JSON.parse(item));

    // ==================== RULE 1: High Temperature Sustained ====================
    const highTempRecords = temps.filter(t => t.temp > 15);
    const highTempDurationMinutes = (highTempRecords.length * 10) / 60; // assuming data every 10 seconds

    if (highTempDurationMinutes >= 50) {
      await this.createAnomalyNotification(machineId, {
        type: NotificationType.HIGH_TEMP_SUSTAINED,
        message: `Temperature stayed above 15°C for more than ${Math.round(highTempDurationMinutes)} minutes`,
        severity: 'critical',
        data: {
          currentTemp,
          highTempDurationMinutes: Math.round(highTempDurationMinutes),
          maxTemp: Math.max(...temps.map(t => t.temp))
        }
      });
    }

    // ==================== RULE 2: Compressor Never Reaches Setpoint ====================
    const last30MinRecords = temps.slice(0, 180); // last ~30 minutes
    const avgTempLast30Min = last30MinRecords.reduce((sum, t) => sum + t.temp, 0) / last30MinRecords.length;

    if (avgTempLast30Min > 10 && currentTemp > 8) {
      await this.createAnomalyNotification(machineId, {
        type: NotificationType.COMPRESSOR_NEVER_STOPS,
        message: `Compressor running continuously but temperature not reaching setpoint (Avg: ${avgTempLast30Min.toFixed(1)}°C)`,
        severity: 'warning',
        data: {
          currentTemp,
          avgTempLast30Min: parseFloat(avgTempLast30Min.toFixed(1)),
          recordsChecked: last30MinRecords.length
        }
      });
    }
  }

  /**
   * Create and dispatch anomaly notification
   */
  private async createAnomalyNotification(
    machineId: string,
    anomaly: Omit<AnomalyNotification, 'id' | 'machineId' | 'createdAt'>
  ): Promise<void> {
    const notification: AnomalyNotification = {
      id: `notif_${Date.now()}_${machineId}`,
      machineId,
      ...anomaly,
      createdAt: new Date()
    };

    try {
      // 1. Save to Redis
      await this.redisClient.lpush(`notifications:${machineId}`, JSON.stringify(notification));
      await this.redisClient.lpush('notifications:all', JSON.stringify(notification));

      // Keep only last 100 per machine and 500 globally
      await this.redisClient.ltrim(`notifications:${machineId}`, 0, 99);
      await this.redisClient.ltrim('notifications:all', 0, 499);

      // 2. Emit to WebSocket (Admin Dashboard)
      this.emitToAdmins(EMessage.all, this.wss, 'new_anomaly', notification,false);

      // 3. Trigger external notification (WA / Google) - if provided
      if (this.notificationService) {
        await this.notificationService(notification);
      }

      console.log(`[ANOMALY DETECTED] ${notification.type} on machine ${machineId}`);
    } catch (error) {
      console.error('Failed to create anomaly notification:', error);
    }
  }

  /**
   * Optional: Get recent notifications (can be used in API)
   */
  public async getRecentNotifications(limit: number = 50): Promise<AnomalyNotification[]> {
    const raw = await this.redisClient.lrange('notifications:all', 0, limit - 1);
    return raw.map(item => JSON.parse(item));
  }

  public async getMachineNotifications(machineId: string, limit: number = 50): Promise<AnomalyNotification[]> {
    const raw = await this.redisClient.lrange(`notifications:${machineId}`, 0, limit - 1);
    return raw.map(item => JSON.parse(item));
  }
}