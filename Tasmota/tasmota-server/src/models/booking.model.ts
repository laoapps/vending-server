// src/models/booking.model.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import RoomModel from './room.model';

export class BookingModel extends Model {
  public id!: number;
  public roomId!: number;
  public userUuid!: string;
  public checkIn!: Date;
  public checkOut!: Date;
  public guests!: number;
  public totalPrice!: number;
  public status!: 'pending' | 'paid' | 'cancelled' | 'checked_out';
  public paidAt?: Date;
  public cancelledAt?: Date;
}

BookingModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    roomId: { type: DataTypes.INTEGER, allowNull: false },
    userUuid: { type: DataTypes.STRING, allowNull: false },
    checkIn: { type: DataTypes.DATE, allowNull: false },
    checkOut: { type: DataTypes.DATE, allowNull: false },
    guests: { type: DataTypes.INTEGER, defaultValue: 1 },
    totalPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: { 
      type: DataTypes.ENUM('pending', 'paid', 'cancelled', 'checked_out'),
      defaultValue: 'pending'
    },
    paidAt: { type: DataTypes.DATE },
    cancelledAt: { type: DataTypes.DATE },
  },
  { sequelize, tableName: 'bookings', timestamps: true }
);

BookingModel.belongsTo(RoomModel, { foreignKey: 'roomId', as: 'room' });
RoomModel.hasMany(BookingModel, { foreignKey: 'roomId', as: 'bookings' });

export default BookingModel;