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
        const device = await models.Device.findByPk(schedule.deviceId);
        if (!device) return;

        await publishMqttMessage(`cmnd/${device.tasmotaId}/${schedule.command}`, '');

        await models.ScheduleHistory.create({
          scheduleId: schedule.id,
          deviceId: schedule.deviceId,
          userUuid: 'system', // System-triggered
          action: schedule.command,
          executedAt: new Date(),
        } as any);
      },
      null,
      true,
      'UTC'
    );
  }
};

export const monitorConditions = async (topic: string, message: Buffer) => {
  const tasmotaId = topic.split('/')[1];
  const data = JSON.parse(message.toString());

  const device = await models.Device.findOne({ where: { tasmotaId } });
  if (!device) return;

  const power = data?.ENERGY?.Power || 0;
  const energy = data?.ENERGY?.Total || 0;
  await device.update({ power, energy });

  const schedules = await models.Schedule.findAll({
    where: { deviceId: device.id, type: 'conditional', active: true },
  });

  for (const schedule of schedules) {
    let shouldExecute = false;
    if (schedule.conditionType === 'power_overload' && power > (schedule.conditionValue || 0)) {
      shouldExecute = true;
    } else if (schedule.conditionType === 'energy_limit' && energy > (schedule.conditionValue || 0)) {
      shouldExecute = true;
    }

    if (shouldExecute) {
      await publishMqttMessage(`cmnd/${tasmotaId}/${schedule.command}`, '');
      await models.ScheduleHistory.create({
        scheduleId: schedule.id,
        deviceId: schedule.deviceId,
        userUuid: 'system',
        action: schedule.command,
        executedAt: new Date(),
      } as any);
    }
  }
};