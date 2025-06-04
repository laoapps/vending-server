import { Sequelize, DataTypes, Model } from 'sequelize';

export class DeviceGroup extends Model {
  public id!: number;
  public name!: string;
  public ownerId!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initDeviceGroupModel(sequelize: Sequelize) {
  DeviceGroup.init(
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
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'DeviceGroup',
      tableName: 'DeviceGroups',
    }
  );
  return DeviceGroup;
}