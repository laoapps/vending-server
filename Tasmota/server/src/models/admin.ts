import { Sequelize, DataTypes, Model } from 'sequelize';

export interface AdminAttributes {
  id: number;
  uuid: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Admin extends Model<AdminAttributes> {
  // Remove public class fields
}

export function initAdminModel(sequelize: Sequelize) {
  Admin.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Admin',
      tableName: 'Admins',
    }
  );
  return Admin;
}