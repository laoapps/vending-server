import { z } from 'zod';
import models from '../models';
import { Device, DeviceAssociations, DeviceAttributes } from '../models/device';
import { publishMqttMessage } from './mqttService';
import { findUuidByPhoneNumberOnUserManager } from './userManagerService';

type DeviceWithAssociations = Device & DeviceAssociations;
interface User {
  uuid: string;
  role: string;
}

const controlDeviceSchema = z.object({
  command: z.enum(['ON', 'OFF', 'TOGGLE']).default('TOGGLE'),
  relay: z.number().int().min(1).default(1),
  conditionType: z.enum(['time_duration', 'energy_consumption']).optional(),
  conditionValue: z.number().min(1).optional(),
}).refine(
  (data) => !data.conditionType || (data.conditionType && data.conditionValue),
  { message: 'conditionValue is required when conditionType is provided' }
);

export class DeviceService {
  static async createDevice(ownerUuid: string, name: string, tasmotaId: string, zone?: string, groupId?:number): Promise<Device> {
  console.log('createDevice2');

    const owner = await models.Owner.findOne({ where: { uuid: ownerUuid } });
  console.log('createDevice3',owner);

    if (!owner) throw new Error('Owner not found');

    const device = await models.Device.create({
      name,
      tasmotaId,
      zone,
      ownerId: owner.dataValues.id,
      groupId,
      status: {},
    } as DeviceAttributes);

  console.log('createDevice3.5',device);


    return device;
  }

  static async getDevices(user: User): Promise<Device[]> {
    if (user.role === 'admin') {
      return models.Device.findAll({
        include: [
          { model: models.Owner, as: 'owner' },
          { model: models.DeviceGroup, as: 'deviceGroup' },
        ],
      });
    } else if (user.role === 'owner') {
      const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
      if (!owner) throw new Error('Owner not found');

      return models.Device.findAll({
        where: { ownerId: owner.dataValues.id },
        include: [{ model: models.DeviceGroup, as: 'deviceGroup' }],
      });
    } else {
      return models.Device.findAll({
        include: [
          { as: 'userDevices', where: { userUuid: user.uuid } },
          { model: models.Owner, as: 'owner' },
          { model: models.DeviceGroup, as: 'deviceGroup' },
        ],
      });
    }
  }

  static async updateDevice(ownerUuid: string, id: number, data: Partial<DeviceAttributes>): Promise<Device> {
    const owner = await models.Owner.findOne({ where: { uuid: ownerUuid } });
    if (!owner) throw new Error('Owner not found');

    const device = await models.Device.findOne({ where: { id, ownerId: owner.dataValues.id } });
    if (!device) throw new Error('Device not found or not owned');

    await device.update(data);
    return device;
  }

  static async deleteDevice(ownerUuid: string, id: number): Promise<void> {
    const owner = await models.Owner.findOne({ where: { uuid: ownerUuid } });
    if (!owner) throw new Error('Owner not found');

    const device = await models.Device.findOne({ where: { id, ownerId: owner.dataValues.id } });
    if (!device) throw new Error('Device not found or not owned');

    await device.destroy();
  }

  static async controlDevice(deviceId: number, input: { command?: string; relay?: number; conditionType?: string; conditionValue?: number }): Promise<void> {
    try {
      const { command, relay, conditionType, conditionValue } = controlDeviceSchema.parse(input);
      const device: DeviceWithAssociations | null = await models.Device.findByPk(deviceId, {
        include: [{ model: models.Owner, as: 'owner' }],
      });

      if (!device) throw new Error('Device not found');
      console.log(`Controlling device with ID: ${deviceId}, Command: ${command}, Relay: ${relay}`);

      // Clear existing rule and timer
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '');
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, '');

      // Set new rule or timer if provided
      if (conditionType === 'energy_consumption' && conditionValue) {
        await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/EnergyReset`, '0');
        const rule = `ON Energy#Total>${conditionValue} DO Power${relay} OFF ENDON`;
        await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, rule);
        await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Rule1`, '1');
      } else if (conditionType === 'time_duration' && conditionValue) {
        const minutes = Math.ceil(conditionValue);
        const timer = `{"Enable":1,"Mode":0,"Time":"0:${minutes}","Action":0}`;
        await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/Timer1`, timer);
      }

      const mqttTopic = `cmnd/${device.dataValues.tasmotaId}/POWER${relay === 1 ? '' : relay}`;
      console.log(`Sending MQTT command to ${mqttTopic} with payload: ${command}`);
      await publishMqttMessage(mqttTopic, command);
    } catch (error) {
      console.error('Error controlling device:', error);
      throw error;
    }
  }
}