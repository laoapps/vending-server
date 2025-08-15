import { Sequelize, DataTypes, Model } from 'sequelize';

export interface OwnerAttributes {
  id: number;
  uuid: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Owner extends Model<OwnerAttributes> {
  // No public class fields, which is correct
}

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