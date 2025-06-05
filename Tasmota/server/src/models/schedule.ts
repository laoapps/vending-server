import { Sequelize, DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { DeviceAttributes } from './device';
import { SchedulePackageAttributes } from './schedulePackage';

export interface ScheduleAttributes {
  id: number;
  deviceId: number;
  packageId: number | null;
  type: string;
  cron?: string;
  command: string;
  conditionType?: string;
  conditionValue?: number;
  active: boolean;
  createdBy?: string;
  startEnergy?: number; // New field for initial energy reading
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleInstance extends Model<ScheduleAttributes>, ScheduleAttributes {
  device?: DeviceAttributes;
  package?: SchedulePackageAttributes;
}

export class Schedule extends Model<ScheduleAttributes, ScheduleInstance> {
  public id!: number;
  public deviceId!: number;
  public packageId!: number | null;
  public type!: string;
  public cron?: string;
  public command!: string;
  public conditionType?: string;
  public conditionValue?: number;
  public active!: boolean;
  public createdBy?: string;
  public startEnergy?: number;
  public createdAt!: Date;
  public updatedAt!: Date;
  public device?: DeviceAttributes;
  public package?: SchedulePackageAttributes;
}

export function initScheduleModel(sequelize: Sequelize) {
  Schedule.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      deviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Devices', key: 'id' },
      },
      packageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'SchedulePackages', key: 'id' },
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cron: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      command: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      conditionType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      conditionValue: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      startEnergy: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Schedule',
      tableName: 'Schedules',
    }
  );
  return Schedule;
}