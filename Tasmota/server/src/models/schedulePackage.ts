import { Sequelize, DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface SchedulePackageAttributes {
  id: number;
  name: string;
  ownerId: number;
  durationMinutes?: number;
  powerConsumptionWatts?: number;
  price?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SchedulePackage extends Model<SchedulePackageAttributes> {
  public id!: number;
  public name!: string;
  public ownerId!: number;
  public durationMinutes?: number;
  public powerConsumptionWatts?: number;
  public price?: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initSchedulePackageModel(sequelize: Sequelize) {
  SchedulePackage.init(
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
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      powerConsumptionWatts: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'SchedulePackage',
      tableName: 'SchedulePackages',
    }
  );
  return SchedulePackage;
}