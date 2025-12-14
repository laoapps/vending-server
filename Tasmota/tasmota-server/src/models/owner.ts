// src/models/owner.ts
import { Sequelize, DataTypes, Model } from 'sequelize';

export interface OwnerAttributes {
  id?: number;
  uuid?: string;
  phoneNumber: string;
  merchantKey?: string;   // sensitive
  walletKey?: string;     // sensitive
  createdAt?: Date;
  updatedAt?: Date;
}

export class Owner extends Model<OwnerAttributes> {}

export function initOwnerModel(sequelize: Sequelize) {
  Owner.init(
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
      merchantKey: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      walletKey: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Owner',
      tableName: 'owners',
    }
  );
  return Owner;
}