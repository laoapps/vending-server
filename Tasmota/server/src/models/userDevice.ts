import { Sequelize, DataTypes, Model } from 'sequelize';

export class UserDevice extends Model {
  public id!: number;
  public userUuid!: string;
  public deviceId!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
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