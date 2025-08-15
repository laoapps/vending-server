import { Sequelize, DataTypes, Model } from 'sequelize';
import { Device } from './device';

export interface ScheduleHistoryAttributes {
  id: number;
  scheduleId: number;
  deviceId: number;
  userUuid: string;
  action: string;
  executedAt: Date;
  createdAt: Date;
}

export class ScheduleHistory extends Model<ScheduleHistoryAttributes> {
  // No public class fields
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
        references: { model: 'devices', key: 'id' },
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