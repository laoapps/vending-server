import { CronJob } from 'cron';
import models from '../models';
import { publishMqttMessage } from './mqttService';

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
          await publishMqttMessage(`cmnd/${device.tasmotaId}/${schedule.command}`, '');
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
  const tasmotaId = topic.split('/')[1];
  try {
    const data = JSON.parse(message.toString());

    const device = await models.Device.findOne({ where: { tasmotaId } });
    if (!device) {
      console.error(`Device not found for tasmotaId: ${tasmotaId}`);
      return;
    }

    const power = data?.ENERGY?.Power || 0;
    const energy = data?.ENERGY?.Total || 0;
    await device.update({ power, energy });

    const schedules = await models.Schedule.findAll({
      where: { deviceId: device.id, type: 'conditional', active: true },
    });

    for (const schedule of schedules) {
      if (schedule.conditionType === 'power_overload' && power > (schedule.conditionValue || 0)) {
        await publishMqttMessage(`cmnd/${tasmotaId}/${schedule.command}`, '');
      } else if (schedule.conditionType === 'energy_limit' && energy > (schedule.conditionValue || 0)) {
        await publishMqttMessage(`cmnd/${tasmotaId}/${schedule.command}`, '');
      }
    }
  } catch (error) {
    console.error('Error monitoring conditions:', error);
  }
};