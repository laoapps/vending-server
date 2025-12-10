import { Sequelize, DataTypes, Model } from 'sequelize';

export interface DeviceGroupAttributes {
  id: number;
  isActive: boolean;
  name: string;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
  description: any;
}

export class DeviceGroup extends Model<DeviceGroupAttributes> {
  // Remove public class fields

}

export function initDeviceGroupModel(sequelize: Sequelize) {
  DeviceGroup.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'DeviceGroup',
      tableName: 'devicegroups',
    }
  );
  return DeviceGroup;
}