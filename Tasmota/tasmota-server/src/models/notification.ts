import { Sequelize, DataTypes, Model } from 'sequelize';

export interface NotificationAttributes {
  id: number;
  type: string;
  content: any; // JSONB for notification details
  userUuid: string | null;
  ownerId: number | null;
  adminNotified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Notification extends Model<NotificationAttributes> {
  // No public class fields
}

export function initNotificationModel(sequelize: Sequelize) {
  Notification.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      userUuid: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      adminNotified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'notifications',
    }
  );
  return Notification;
}