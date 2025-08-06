import sequelize from '../config/database';
import { initOwnerModel, Owner } from './owner';
import { initDeviceModel, Device } from './device';
import { initDeviceGroupModel, DeviceGroup } from './deviceGroup';


import { initAdminModel, Admin } from './admin';
import { initSchedulePackageModel, SchedulePackage } from './schedulePackage';
import { initUnregisteredDeviceModel, UnregisteredDevice } from './unregisteredDevice';
import { initScheduleHistoryModel, ScheduleHistory } from './scheduleHistory';
import { initOrderModel, Order } from './order';

const models = {
  Owner: initOwnerModel(sequelize),
  Device: initDeviceModel(sequelize),
  DeviceGroup: initDeviceGroupModel(sequelize),


  Admin: initAdminModel(sequelize),
  SchedulePackage: initSchedulePackageModel(sequelize),
  UnregisteredDevice: initUnregisteredDeviceModel(sequelize),
  ScheduleHistory: initScheduleHistoryModel(sequelize),
  Order:initOrderModel(sequelize),
};

// Define relationships
models.Owner.hasMany(models.Device, { foreignKey: 'ownerId', as: 'devices' });
models.Device.belongsTo(models.Owner, { foreignKey: 'ownerId', as: 'owner' });

models.Owner.hasMany(models.DeviceGroup, { foreignKey: 'ownerId', as: 'groups' });
models.DeviceGroup.belongsTo(models.Owner, { foreignKey: 'ownerId', as: 'owner' });

models.DeviceGroup.hasMany(models.Device, { foreignKey: 'groupId', as: 'devices' });
models.Device.belongsTo(models.DeviceGroup, { foreignKey: 'groupId', as: 'deviceGroup' });



// order  has many schedule
models.Device.hasMany(models.Order,{ foreignKey: 'deviceId', as: 'orders' })
models.Order.belongsTo(models.Device, { foreignKey: 'deviceId', as: 'device' });


models.SchedulePackage.hasMany(models.Order, { foreignKey: 'packageId', as: 'orders' })
models.Order.belongsTo(models.SchedulePackage, { foreignKey: 'packageId', as: 'package' });


models.Owner.hasMany(models.SchedulePackage, { foreignKey: 'ownerId', as: 'schedulePackages' });
models.SchedulePackage.belongsTo(models.Owner, { foreignKey: 'ownerId', as: 'owner' });


models.Device.hasMany(models.ScheduleHistory, { foreignKey: 'deviceId', as: 'scheduleHistories' });
models.ScheduleHistory.belongsTo(models.Device, { foreignKey: 'deviceId', as: 'device' });

export default models;
export { sequelize };