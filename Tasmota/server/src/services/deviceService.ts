
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

// Input validation schema for controlDevice
const controlDeviceSchema = z.object({
  command: z.enum(['ON', 'OFF', 'TOGGLE']).default('TOGGLE'),
  relay: z.number().int().min(1).default(1),
});

export class DeviceService {
  static async createDevice(ownerUuid: string, name: string, tasmotaId: string, zone?: string): Promise<Device> {
    const owner = await models.Owner.findOne({ where: { uuid: ownerUuid } });
    if (!owner) throw new Error('Owner not found');

    const device = await models.Device.create({
      name,
      tasmotaId,
      zone,
      ownerId: owner.dataValues.id,
      status: {},
    } as DeviceAttributes);

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
        include: [

          { model: models.DeviceGroup, as: 'deviceGroup' },
        ],
      });
    } else {
      return models.Device.findAll({
        include: [
          {

            as: 'userDevices',
            where: { userUuid: user.uuid },
          },
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

  static async controlDevice( deviceId: number, input: { command?: string; relay?: number }): Promise<void> {
    try {
      // Validate input
      const { command, relay } = controlDeviceSchema.parse(input);

      const device: DeviceWithAssociations | null = await models.Device.findByPk(deviceId, {
        include: [
          { model: models.Owner, as: 'owner' },

        ],
      });

      if (!device) throw new Error('Device not found');
      console.log(`Controlling device with ID: ${deviceId}, Command: ${command}, Relay: ${relay} `);


      const mqttTopic = `cmnd/${device.dataValues.tasmotaId}/POWER${relay === 1 ? '' : relay}`;
      console.log(`Sending MQTT command to ${mqttTopic} with payload: ${command}`);
      await publishMqttMessage(mqttTopic, command);
    } catch (error) {
      console.error('Error controlling device:', error);
      throw error;
    }
  }

}
