import models from '../models';
import { DeviceAttributes } from '../models/device';
import { publishMqttMessage } from './mqttService';
import { findUuidByPhoneNumberOnUserManager } from './userManagerService';

export class DeviceService {
  static async createDevice(ownerUuid: string, name: string, tasmotaId: string, zone?: string): Promise<DeviceAttributes> {
    const owner = await models.Owner.findOne({ where: { uuid: ownerUuid } });
    if (!owner) throw new Error('Owner not found');

    const device = await models.Device.create({
      name,
      tasmotaId,
      zone,
      ownerId: owner.id,
      status: {},
    } as DeviceAttributes);

    return device;
  }

  static async getDevices(user: { uuid: string; role: string }): Promise<DeviceAttributes[]> {
    if (user.role === 'admin') {
      return models.Device.findAll({
        include: [
          { model: models.Owner, as: 'owner' },
          { model: models.UserDevice, as: 'userDevices' },
          { model: models.DeviceGroup, as: 'deviceGroup' },
        ],
      });
    } else if (user.role === 'owner') {
      const owner = await models.Owner.findOne({ where: { uuid: user.uuid } });
      if (!owner) throw new Error('Owner not found');

      return models.Device.findAll({
        where: { ownerId: owner.id },
        include: [
          { model: models.UserDevice, as: 'userDevices' },
          { model: models.DeviceGroup, as: 'deviceGroup' },
        ],
      });
    } else {
      return models.Device.findAll({
        include: [
          {
            model: models.UserDevice,
            as: 'userDevices',
            where: { userUuid: user.uuid },
          },
          { model: models.Owner, as: 'owner' },
          { model: models.DeviceGroup, as: 'deviceGroup' },
        ],
      });
    }
  }

  static async updateDevice(ownerUuid: string, id: number, data: Partial<DeviceAttributes>): Promise<DeviceAttributes> {
    const owner = await models.Owner.findOne({ where: { uuid: ownerUuid } });
    if (!owner) throw new Error('Owner not found');

    const device = await models.Device.findOne({ where: { id, ownerId: owner.id } });
    if (!device) throw new Error('Device not found or not owned');

    await device.update(data);
    return device;
  }

  static async deleteDevice(ownerUuid: string, id: number): Promise<void> {
    const owner = await models.Owner.findOne({ where: { uuid: ownerUuid } });
    if (!owner) throw new Error('Owner not found');

    const device = await models.Device.findOne({ where: { id, ownerId: owner.id } });
    if (!device) throw new Error('Device not found or not owned');

    await device.destroy();
  }

  static async controlDevice(user: { uuid: string; role: string }, deviceId: number, command: string): Promise<void> {
    try {
      const device = await models.Device.findByPk(deviceId, {
        include: [
          { model: models.Owner, as: 'owner' },
          { model: models.UserDevice, as: 'userDevices' },
        ],
      });

      if (!device) throw new Error('Device not found');

      const isOwner = device.owner?.uuid === user.uuid;
      const isAssignedUser = device.userDevices?.some((ud: any) => ud.userUuid === user.uuid);
      console.log(`User UUID: ${user.uuid}, Device Owner UUID: ${device.owner?.uuid}, Assigned Users: ${device.userDevices?.map((ud: any) => ud.userUuid).join(', ')}`);
      if (!isOwner && !isAssignedUser) {
        throw new Error('Unauthorized');
      }

      console.log(`Controlling device ${device.tasmotaId} cmnd/${device.tasmotaId}/${command}`);
      await publishMqttMessage(`cmnd/${device.tasmotaId}/${command}`, '');
    } catch (error) {
      console.error('Error controlling device:', error);
      throw error;
    }
  }

  static async assignDeviceToUser(ownerUuid: string, deviceId: number, userPhoneNumber: string): Promise<any> {
    const owner = await models.Owner.findOne({ where: { uuid: ownerUuid } });
    if (!owner) throw new Error('Owner not found');

    const device = await models.Device.findOne({ where: { id: deviceId, ownerId: owner.id } });
    if (!device) throw new Error('Device not found or not owned');

    const userData = await findUuidByPhoneNumberOnUserManager(userPhoneNumber);
    if (!userData) throw new Error('User not found');

    const userDevice = await models.UserDevice.create({
      userUuid: userData.uuid,
      deviceId,
    });

    return userDevice;
  }
}