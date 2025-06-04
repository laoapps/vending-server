import { Sequelize, DataTypes, Model } from 'sequelize';
import { Owner } from './owner';
import { DeviceGroup } from './deviceGroup';
import { UserDevice } from './userDevice';
import { Schedule } from './schedule';

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

export class Device extends Model<DeviceAttributes> {
  public id!: number;
  public name!: string;
  public tasmotaId!: string;
  public zone?: string;
  public ownerId!: number;
  public status!: any;
  public power?: number;
  public energy?: number;
  public groupId?: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Associations
  public owner?: Owner;
  public deviceGroup?: DeviceGroup;
  public userDevices?: UserDevice[];
  public schedules?: Schedule[];
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
      tableName: 'Devices',
    }
  );
  return Device;
}