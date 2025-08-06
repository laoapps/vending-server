
import { Sequelize, DataTypes, Model } from 'sequelize';
import { OwnerAttributes } from './owner';
import { DeviceGroupAttributes } from './deviceGroup';


import { ScheduleHistoryAttributes } from './scheduleHistory';

export interface DeviceAttributes {
  id: number;
  name: string;
  tasmotaId: string;
  zone?: string;
  ownerId: number;
  status: any;
  power?: number;
  energy?: number;
  groupId?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Extend the attributes to include associations
export interface DeviceAssociations {
  owner?: OwnerAttributes;
  deviceGroup?: DeviceGroupAttributes;


  scheduleHistories?: ScheduleHistoryAttributes[];
}

export class Device extends Model<DeviceAttributes & DeviceAssociations> {
  // No public class fields
}

export function initDeviceModel(sequelize: Sequelize) {
  Device.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tasmotaId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      zone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Owners', key: 'id' },
      },
      status: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      power: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      energy: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'DeviceGroups', key: 'id' },
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Device',
      tableName: 'Devices',
    }
  );
  return Device;
}
