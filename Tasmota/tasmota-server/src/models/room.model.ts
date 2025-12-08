// src/models/room.model.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class RoomModel extends Model {
  public id!: number;
  public locationId!: number;
  public name!: string;
  public price!: number;
  public details?: string;
  public photo?: string;
  public capacity!: number;
  public deviceId?: number | null;
  public hotelCheckIn?: Date | null;
  public hotelCheckOut?: Date | null;
  public available!: boolean;

  public roomType?: 'time_only' | 'kwh_only' | 'both';
  public acceptsTime?: boolean;
  public acceptsKwh?: boolean;
}

RoomModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    locationId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    details: DataTypes.TEXT,
    photo: DataTypes.STRING,
    capacity: { type: DataTypes.INTEGER, allowNull: false },
    deviceId: { type: DataTypes.INTEGER, allowNull: true },
    hotelCheckIn: { type: DataTypes.DATE, allowNull: true },
    hotelCheckOut: { type: DataTypes.DATE, allowNull: true },
    available: { type: DataTypes.BOOLEAN, defaultValue: true },
    roomType: {
      type: DataTypes.ENUM('time_only', 'kwh_only', 'both'),
      defaultValue: 'both',
    },
    acceptsTime: { type: DataTypes.BOOLEAN, defaultValue: true },
    acceptsKwh: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'rooms',
    timestamps: true,
  }
);

export default RoomModel;