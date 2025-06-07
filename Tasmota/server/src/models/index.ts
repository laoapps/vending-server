import sequelize from '../config/database';
import { initOwnerModel, Owner } from './owner';
import { initDeviceModel, Device } from './device';
import { initDeviceGroupModel, DeviceGroup } from './deviceGroup';
import { initScheduleModel, Schedule } from './schedule';
import { initUserDeviceModel, UserDevice } from './userDevice';
import { initAdminModel, Admin } from './admin';
import { initSchedulePackageModel, SchedulePackage } from './schedulePackage';
import { initUnregisteredDeviceModel, UnregisteredDevice } from './unregisteredDevice';
import { initScheduleHistoryModel, ScheduleHistory } from './scheduleHistory';

const models = {
  Owner: initOwnerModel(sequelize),
  Device: initDeviceModel(sequelize),
  DeviceGroup: initDeviceGroupModel(sequelize),
  Schedule: initScheduleModel(sequelize),
  UserDevice: initUserDeviceModel(sequelize),
  Admin: initAdminModel(sequelize),
  SchedulePackage: initSchedulePackageModel(sequelize),
  UnregisteredDevice: initUnregisteredDeviceModel(sequelize),
  ScheduleHistory: initScheduleHistoryModel(sequelize),
};

// Define relationships
models.Owner.hasMany(models.Device, { foreignKey: 'ownerId', as: 'devices' });
models.Device.belongsTo(models.Owner, { foreignKey: 'ownerId', as: 'owner' });

models.Owner.hasMany(models.DeviceGroup, { foreignKey: 'ownerId', as: 'groups' });
models.DeviceGroup.belongsTo(models.Owner, { foreignKey: 'ownerId', as: 'owner' });

models.DeviceGroup.hasMany(models.Device, { foreignKey: 'groupId', as: 'devices' });
models.Device.belongsTo(models.DeviceGroup, { foreignKey: 'groupId', as: 'deviceGroup' });

models.Device.hasMany(models.Schedule, { foreignKey: 'deviceId', as: 'schedules' });
models.Schedule.belongsTo(models.Device, { foreignKey: 'deviceId', as: 'device' });

models.Device.hasMany(models.UserDevice, { foreignKey: 'deviceId', as: 'userDevices' });
models.UserDevice.belongsTo(models.Device, { foreignKey: 'deviceId', as: 'device' });

models.Owner.hasMany(models.SchedulePackage, { foreignKey: 'ownerId', as: 'schedulePackages' });
models.SchedulePackage.belongsTo(models.Owner, { foreignKey: 'ownerId', as: 'owner' });

models.SchedulePackage.hasMany(models.Schedule, { foreignKey: 'packageId', as: 'schedules' });
models.Schedule.belongsTo(models.SchedulePackage, { foreignKey: 'packageId', as: 'package' });

models.Schedule.hasMany(models.ScheduleHistory, { foreignKey: 'scheduleId', as: 'histories' });
models.ScheduleHistory.belongsTo(models.Schedule, { foreignKey: 'scheduleId', as: 'schedule' });

models.Device.hasMany(models.ScheduleHistory, { foreignKey: 'deviceId', as: 'scheduleHistories' });
models.ScheduleHistory.belongsTo(models.Device, { foreignKey: 'deviceId', as: 'device' });

export default models;
export { sequelize };