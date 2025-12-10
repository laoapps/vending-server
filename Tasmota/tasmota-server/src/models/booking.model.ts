// src/models/booking.model.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class BookingModel extends Model {
  public id!: number;                    // ← we will change to INTEGER in next step
  public roomId!: number;
  public userUuid!: string;
  public checkIn!: Date;
  public checkOut!: Date;
  public guests!: number;
  public totalPrice!: number;
  public status!: 'pending' | 'paid' | 'cancelled' | 'checked_out';
  public paidAt?: Date | null;
  public cancelledAt?: Date | null;
}

BookingModel.init(
  {
    id: {
      type: DataTypes.INTEGER,             // ← changed from UUID to INTEGER
      autoIncrement: true,
      primaryKey: true,
    },
    roomId: { type: DataTypes.INTEGER, allowNull: false },
    userUuid: { type: DataTypes.STRING, allowNull: false },
    checkIn: { type: DataTypes.DATE, allowNull: false },
    checkOut: { type: DataTypes.DATE, allowNull: false },
    guests: { type: DataTypes.INTEGER, defaultValue: 1 },
    totalPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'cancelled', 'checked_out'),
      defaultValue: 'pending',
    },
    paidAt: { type: DataTypes.DATE, allowNull: true },
    cancelledAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'bookings',
    timestamps: true,
  }
);

export default BookingModel;