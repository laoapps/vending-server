import { Sequelize, DataTypes, Model } from 'sequelize';

export interface UserDeviceAttributes {
  id: number;
  userUuid: string;
  deviceId: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserDevice extends Model<UserDeviceAttributes> {
  // Remove public class fields
}

export function initUserDeviceModel(sequelize: Sequelize) {
  UserDevice.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userUuid: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      deviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Devices', key: 'id' },
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'UserDevice',
      tableName: 'UserDevices',
    }
  );
  return UserDevice;
}