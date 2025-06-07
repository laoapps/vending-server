import models from '../models';
import { Device, DeviceAssociations, DeviceAttributes } from '../models/device';
import { publishMqttMessage } from './mqttService';
import { findUuidByPhoneNumberOnUserManager } from './userManagerService';

type DeviceWithAssociations = Device & DeviceAssociations;
export class DeviceService {
  static async createDevice(ownerUuid: string, name: string, tasmotaId: string, zone?: string): Promise<Device> {
    const owner = await models.Owner.findOne({ where: { uuid: ownerUuid } });
    console.log('Owner:', owner);
    console.log('Creating device for owner:', ownerUuid, 'Owner found:', owner?.dataValues.id);
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

  static async getDevices(user: { uuid: string; role: string }): Promise<Device[]> {
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
        where: { ownerId: owner.dataValues.id },
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

  static async controlDevice(user: { uuid: string; role: string }, deviceId: number, command: string): Promise<void> {
    try {
      const device:DeviceWithAssociations|null = await models.Device.findByPk(deviceId, {
        include: [
          { model: models.Owner, as: 'owner' },
          { model: models.UserDevice, as: 'userDevices' },
        ]
      });

      if (!device) throw new Error('Device not found');

      console.log('Device instance:', device);
      console.log('Device owner:', device.owner);
      console.log('Device userDevices:', device.userDevices);
      console.log(
        `Controlling device with ID: ${deviceId}, Command: ${command}`,
        'device', device,
        'device owner', device.owner,
        'device user device', device.userDevices?.length
      );
      console.log(`Controlling device with ID: ${deviceId}, Command: ${command} by User: ${user.uuid}`, user);

      const isOwner = device.owner?.uuid === user.uuid;
      const isAssignedUser = device.userDevices?.some((ud: any) => ud.userUuid === user.uuid);
      console.log(
        `User UUID: ${user.uuid}, Device Owner UUID: ${device.owner?.uuid}, Assigned Users: ${device.userDevices?.map((ud: any) => ud.userUuid).join(', ') || 'none'
        }`
      );

      if (!isOwner && !isAssignedUser) {
        throw new Error('Unauthorized');
      }

      console.log(`Controlling device ${device.dataValues.tasmotaId} cmnd/${device.dataValues.tasmotaId}/${command}`);
      await publishMqttMessage(`cmnd/${device.dataValues.tasmotaId}/${command}`, '');
    } catch (error) {
      console.error('Error controlling device:', error);
      throw error;
    }
  }

  static async assignDeviceToUser(ownerUuid: string, deviceId: number, userPhoneNumber: string): Promise<any> {
    const owner = await models.Owner.findOne({ where: { uuid: ownerUuid } });
    if (!owner) throw new Error('Owner not found');

    const device = await models.Device.findOne({ where: { id: deviceId, ownerId: owner.dataValues.id } });
    if (!device) throw new Error('Device not found or not owned');

    const userData = await findUuidByPhoneNumberOnUserManager(userPhoneNumber);
    if (!userData) throw new Error('User not found');

    const userDevice = await models.UserDevice.create({
      userUuid: userData.uuid,
      deviceId,
    } as any);

    return userDevice;
  }
}