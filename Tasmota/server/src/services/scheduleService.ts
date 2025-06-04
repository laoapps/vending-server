import { Schedule } from '@prisma/client';
import { CronJob } from 'cron';
import { PrismaClient } from '@prisma/client';
import { publishMqttMessage } from './mqttService';

const prisma = new PrismaClient();

export const scheduleJob = (schedule: Schedule) => {
  if (schedule.type === 'timer' && schedule.cron) {
    new CronJob(
      schedule.cron,
      async () => {
        if (!schedule.active) return;
        const device = await prisma.device.findUnique({ where: { id: schedule.deviceId } });
        if (device) {
          await publishMqttMessage(`cmnd/${device.tasmotaId}/${schedule.command}`, '');
        }
      },
      null,
      true,
      'UTC'
    );
  }
};

// Monitor power and energy via MQTT telemetry
export const monitorConditions = async (topic: string, message: Buffer) => {
  const tasmotaId = topic.split('/')[1];
  const data = JSON.parse(message.toString());

  const device = await prisma.device.findUnique({ where: { tasmotaId } });
  if (!device) return;

  // Update power and energy
  const power = data?.ENERGY?.Power || 0;
  const energy = data?.ENERGY?.Total || 0;
  await prisma.device.update({
    where: { tasmotaId },
    data: { power, energy },
  });

  // Check conditional schedules
  const schedules = await prisma.schedule.findMany({
    where: { deviceId: device.id, type: 'conditional', active: true },
  });

  for (const schedule of schedules) {
    if (schedule.conditionType === 'power_overload' && power > (schedule.conditionValue || 0)) {
      await publishMqttMessage(`cmnd/${tasmotaId}/${schedule.command}`, '');
    } else if (schedule.conditionType === 'energy_limit' && energy > (schedule.conditionValue || 0)) {
      await publishMqttMessage(`cmnd/${tasmotaId}/${schedule.command}`, '');
    }
  }
};