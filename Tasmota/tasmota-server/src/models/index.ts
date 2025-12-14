// src/models/index.ts — FINAL WORKING VERSION

import sequelize from '../config/database';
import { initOwnerModel } from './owner';
import { initDeviceModel } from './device';
import { initDeviceGroupModel } from './deviceGroup';
import { initAdminModel } from './admin';
import { initSchedulePackageModel } from './schedulePackage';
import { initUnregisteredDeviceModel } from './unregisteredDevice';
import { initOrderModel } from './order';
import { initNotificationModel } from './notification';
import { initLocationModel } from './location.model';
import RoomModel from './room.model';
import BookingModel from './booking.model';

// Initialize all models first
const models = {
  Owner: initOwnerModel(sequelize),
  Device: initDeviceModel(sequelize),
  DeviceGroup: initDeviceGroupModel(sequelize),
  Admin: initAdminModel(sequelize),
  SchedulePackage: initSchedulePackageModel(sequelize),
  UnregisteredDevice: initUnregisteredDeviceModel(sequelize),
  Order: initOrderModel(sequelize),
  Notification: initNotificationModel(sequelize),
  Location: initLocationModel(sequelize),
  Room: RoomModel,
  Booking: BookingModel,
};

// NOW define associations — after all models exist
Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

// Manual associations (since you use class models without associate method)
models.Location.hasMany(models.Room, { foreignKey: 'locationId', as: 'rooms', onDelete: 'CASCADE' });
models.Room.belongsTo(models.Location, { foreignKey: 'locationId', as: 'location' });

models.Room.belongsTo(models.Device, { foreignKey: 'deviceId', as: 'device', onDelete: 'SET NULL' });
models.Device.hasOne(models.Room, { foreignKey: 'deviceId', as: 'room' });

models.Room.hasMany(models.Booking, { foreignKey: 'roomId', as: 'bookings', onDelete: 'CASCADE' });
models.Booking.belongsTo(models.Room, { foreignKey: 'roomId', as: 'room' });

models.Device.hasMany(models.Order, { foreignKey: 'deviceId', as: 'orders', onDelete: 'CASCADE' });
models.Order.belongsTo(models.Device, { foreignKey: 'deviceId', as: 'device' });

models.Owner.hasMany(models.Device, { foreignKey: 'ownerId', as: 'devices' });
models.Device.belongsTo(models.Owner, { foreignKey: 'ownerId', as: 'owner' });

models.Owner.hasMany(models.Location, { foreignKey: 'ownerId', as: 'locations' });
models.Location.belongsTo(models.Owner, { foreignKey: 'ownerId', as: 'owner' });

models.Owner.hasMany(models.SchedulePackage, { foreignKey: 'ownerId', as: 'packages' });
models.SchedulePackage.belongsTo(models.Owner, { foreignKey: 'ownerId', as: 'owner' });

models.DeviceGroup.hasMany(models.Device, { foreignKey: 'groupId', as: 'devices' });
models.Device.belongsTo(models.DeviceGroup, { foreignKey: 'groupId', as: 'group' });

export default models;
export { sequelize };