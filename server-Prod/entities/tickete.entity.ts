import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";

export type TicketStatus = 'pending' | 'solving' | 'finished';

export interface TicketAttributes {
  id: number;
  ticketNo: string;                    // Human readable: TKT-20260414-0001
  machineId: string;
  issueType: string;                   // e.g. 'item_not_drop', 'payment_pending', 'jammed', 'other'
  title: string;
  description?: string;
  status: TicketStatus;
  photos: string[];                    // Array of image URLs (after upload)
  resolvedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TicketModel extends Model<TicketAttributes>, TicketAttributes {}

export type TicketStatic = typeof Model & {
  new(values?: object, options?: BuildOptions): TicketModel;
};

export const TicketFactory = (sequelize: Sequelize): TicketStatic => {
  const attributes: ModelAttributes<TicketModel> = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ticketNo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    machineId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    issueType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'solving', 'finished'),
      allowNull: false,
      defaultValue: 'pending',
    },
    photos: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  };

  const Ticket = sequelize.define('Ticket', attributes, {
    tableName: 'tickets',
    freezeTableName: true,
    timestamps: true,
  });

  return Ticket as any;
};