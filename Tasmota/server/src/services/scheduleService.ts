import { CronJob } from 'cron';
import models from '../models';
import { publishMqttMessage } from './mqttService';
import { Schedule, ScheduleAssociations } from '../models/schedule';
type ScheduleWithAssociations = Schedule & ScheduleAssociations;
export const scheduleJob = async (schedule: {
  id: number;
  deviceId: number;
  type: string;
  cron?: string;
  command: string;
  active: boolean;
}) => {
  if (schedule.type === 'timer' && schedule.cron) {
    new CronJob(
      schedule.cron,
      async () => {
        if (!schedule.active) return;
        try {
          const device = await models.Device.findByPk(schedule.deviceId);
          if (!device) {
            console.error(`Device not found for schedule ${schedule.id}`);
            return;
          }
          await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/${schedule.command}`, '');
        } catch (error) {
          console.error(`Error in schedule ${schedule.id}:`, error);
        }
      },
      null,
      true,
      'UTC'
    );
  }
};

export const monitorConditions = async (topic: string, message: Buffer) => {
  const parts = topic.split('/');
  const tasmotaId = parts[1];
  const messageStr = message.toString();

  try {
    // Handle LWT messages
    if (parts.length === 3 && parts[2] === 'LWT') {
      if (messageStr === 'Online' || messageStr === 'Offline') {
        const device = await models.Device.findOne({ where: { tasmotaId } });
        if (device) {
          await device.update({ status: { ...device.dataValues.status, online: messageStr === 'Online' } });
          await models.UnregisteredDevice.destroy({ where: { tasmotaId } });
        } else {
          let unregisteredDevice = await models.UnregisteredDevice.findOne({ where: { tasmotaId } });
          if (!unregisteredDevice) {
            unregisteredDevice = await models.UnregisteredDevice.create({ tasmotaId, connectionAttempts: 0, lastConnections: [] } as any);
          }

          if (unregisteredDevice.dataValues.isBanned) {
            console.log(`Ignoring message from banned device ${tasmotaId}`);
            return;
          }

          const lastConnections = [...unregisteredDevice.dataValues.lastConnections, new Date()].slice(-5);
          const connectionAttempts = unregisteredDevice.dataValues.connectionAttempts + 1;
          const isBanned = connectionAttempts >= 5;

          await unregisteredDevice.update({
            connectionAttempts,
            lastConnections,
            isBanned,
          });

          if (isBanned) {
            console.log(`Device ${tasmotaId} banned after ${connectionAttempts} attempts`);
          }
        }
        return;
      }
    }

    // Check if device is banned
    const unregisteredDevice = await models.UnregisteredDevice.findOne({ where: { tasmotaId } });
    if (unregisteredDevice?.dataValues.isBanned) {
      console.log(`Ignoring message from banned device ${tasmotaId}`);
      return;
    }

    // Handle telemetry messages
    const data = JSON.parse(messageStr);
    const device = await models.Device.findOne({ where: { tasmotaId } });
    if (!device) {
      console.error(`Device not found for tasmotaId: ${tasmotaId}`);
      return;
    }

    const power = data?.ENERGY?.Power || 0;
    const energy = data?.ENERGY?.Total || 0;
    await device.update({ power, energy });

    const schedules: Array<ScheduleWithAssociations> | null = await models.Schedule.findAll({
      where: { deviceId: device.dataValues.id, type: 'conditional', active: true },
      include: [{ model: models.SchedulePackage, as: 'package' }],
    });

    for (const schedule of schedules) {
      if (schedule.dataValues.conditionType === 'power_overload' && power > (schedule.dataValues.conditionValue || 0)) {
        await publishMqttMessage(`cmnd/${tasmotaId}/${schedule.dataValues.command}`, '');
      } else if (schedule.dataValues.conditionType === 'energy_limit' && schedule.package && schedule.dataValues.startEnergy !== undefined) {
        const packageEnergyLimit = schedule.package.conditionValue;
        let currentEnergyUsage = energy - schedule.dataValues.startEnergy;
        
        // Handle potential energy reset (e.g., Tasmota device reset)
        if (currentEnergyUsage < 0) {
          console.warn(`Energy reset detected for schedule ${schedule.dataValues.id}, deactivating`);
          await schedule.update({ active: false });
          continue;
        }

        if (currentEnergyUsage >= packageEnergyLimit) {
          await publishMqttMessage(`cmnd/${tasmotaId}/${schedule.dataValues.command}`, '');
          await schedule.update({ active: false });
        }
      }
    }
  } catch (error) {
    console.error('Error monitoring conditions:', error);
  }
};