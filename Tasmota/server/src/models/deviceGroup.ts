import { Sequelize, DataTypes, Model } from 'sequelize';

export interface DeviceGroupAttributes {
  id: number;
  name: string;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
  description: any;
}

export class DeviceGroup extends Model<DeviceGroupAttributes> {
  // Remove public class fields
  // Attributes and associations are handled by Sequelize
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
      tableName: 'DeviceGroups',
    }
  );
  return DeviceGroup;
}