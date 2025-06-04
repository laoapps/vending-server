import { Sequelize, DataTypes, Model } from 'sequelize';
import { Schedule } from './schedule';
import { Device } from './device';

export interface ScheduleHistoryAttributes {
  id: number;
  scheduleId: number;
  deviceId: number;
  userUuid: string;
  action: string; // e.g., "ON", "OFF"
  executedAt: Date;
  createdAt: Date;
}

export class ScheduleHistory extends Model<ScheduleHistoryAttributes> {
  public id!: number;
  public scheduleId!: number;
  public deviceId!: number;
  public userUuid!: string;
  public action!: string;
  public executedAt!: Date;
  public createdAt!: Date;

  public schedule?: Schedule;
  public device?: Device;
}

export function initScheduleHistoryModel(sequelize: Sequelize) {
  ScheduleHistory.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      scheduleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      deviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userUuid: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      executedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'ScheduleHistory',
      tableName: 'ScheduleHistories',
    }
  );
  return ScheduleHistory;
}