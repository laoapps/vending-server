// src/models/index.ts
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

export default models;
export { sequelize };