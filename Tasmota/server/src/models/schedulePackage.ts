import { Sequelize, DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface SchedulePackageAttributes {
  id: number;
  name: string;
  ownerId: number;
  price: number;
  conditionType: 'time_duration' | 'energy_consumption';
  conditionValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SchedulePackage extends Model<SchedulePackageAttributes> {
  public id!: number;
  public name!: string;
  public ownerId!: number;
  public price!: number;
  public conditionType!: 'time_duration' | 'energy_consumption';
  public conditionValue!: number;
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
        references: { model: 'Owners', key: 'id' },
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      conditionType: {
        type: DataTypes.ENUM('time_duration', 'energy_consumption'),
        allowNull: false,
        defaultValue: 'time_duration',
      },
      conditionValue: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
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