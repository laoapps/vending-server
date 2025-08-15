import { Sequelize, DataTypes, Model, BelongsToGetAssociationMixin } from 'sequelize';
import { OwnerAttributes } from './owner';
import { DeviceGroupAttributes } from './deviceGroup';
import { ScheduleHistoryAttributes } from './scheduleHistory';
import { Owner } from './owner'; // Import Owner model for association typing

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

// Update DeviceAssociations to use model types instead of attributes for better typing
export interface DeviceAssociations {
  owner?: Owner; // Use Owner model
  deviceGroup?: DeviceGroupAttributes; // Keep as attributes if no changes needed, or update similarly
  scheduleHistories?: ScheduleHistoryAttributes[]; // Keep as attributes, or update to array of models
}

export class Device extends Model<DeviceAttributes & DeviceAssociations> {
  // Declare association getter methods to satisfy TypeScript
  // declare getOwner: BelongsToGetAssociationMixin<Owner>;
  // If needed, declare other association methods (e.g., for hasMany scheduleHistories)
  // declare getScheduleHistories: HasManyGetAssociationsMixin<ScheduleHistory>;
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
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Device',
      tableName: 'devices',
    }
  );
  return Device;
}