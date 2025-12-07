// src/models/room.model.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import LocationModel from './location.model';
import { Device } from './device'; // Import your existing Device

export class RoomModel extends Model {
  public id!: number;
  public locationId!: number;
  public name!: string;
  public price!: number;           // Price per night (LAK)
  public details?: string;
  public photo?: string;
  public capacity!: number;
  public deviceId?: number;        // ← Link to Tasmota device
  public hotelCheckIn?: Date;      // ← Current guest check-in
  public hotelCheckOut?: Date;     // ← Current guest check-out
  public available!: boolean;
  // Add these fields (optional, for frontend)
    roomType?: 'time_only' | 'kwh_only' | 'both';  // default 'both'
    acceptsTime?: boolean;
    acceptsKwh?: boolean;
    }

RoomModel.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    locationId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    details: DataTypes.TEXT,
    photo: DataTypes.STRING,
    capacity: { type: DataTypes.INTEGER, defaultValue: 2 },
    deviceId: { type: DataTypes.INTEGER, allowNull: true }, // ← Can be null
    hotelCheckIn: { type: DataTypes.DATE, allowNull: true },
    hotelCheckOut: { type: DataTypes.DATE, allowNull: true },
    available: { type: DataTypes.BOOLEAN, defaultValue: true },
    roomType: {
      type: DataTypes.ENUM('time_only', 'kwh_only', 'both'),
      defaultValue: 'both',
    },
    acceptsTime: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    acceptsKwh: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  { sequelize, tableName: 'rooms', timestamps: true }
);

// Associations
RoomModel.belongsTo(LocationModel, { foreignKey: 'locationId', as: 'location' });
RoomModel.belongsTo(Device, { foreignKey: 'deviceId', as: 'device' });
Device.hasOne(RoomModel, { foreignKey: 'deviceId', as: 'room' });

export default RoomModel;