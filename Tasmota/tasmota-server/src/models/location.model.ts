// src/models/location.model.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { Sequelize } from 'sequelize';

export class LocationModel extends Model {
  public id!: number;
  public name!: string;
  public address!: string;
  public description?: any;
  public photo?: string;
  public locationType?:string;
}

LocationModel.init(
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
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.JSONB,
    },
    photo: {
      type: DataTypes.STRING,
    },
    locationType: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    tableName: 'locations',
    timestamps: true,
  }
);

export function initLocationModel(sequelize: Sequelize) {
  const LocationModel = sequelize.define('Location', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.JSONB, //{locationType:'hotel'|'condo'}
    photo: DataTypes.STRING,
    locationType:DataTypes.STRING
  }, {
    tableName: 'locations',
    timestamps: true,
  });

  return LocationModel;
}

export default initLocationModel(sequelize);
