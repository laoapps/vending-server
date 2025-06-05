import { Sequelize, DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface UnregisteredDeviceAttributes {
  id: number;
  tasmotaId: string;
  connectionAttempts: number;
  lastConnections: Date[];
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UnregisteredDevice extends Model<UnregisteredDeviceAttributes> {
  public id!: number;
  public tasmotaId!: string;
  public connectionAttempts!: number;
  public lastConnections!: Date[];
  public isBanned!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initUnregisteredDeviceModel(sequelize: Sequelize) {
  UnregisteredDevice.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tasmotaId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      connectionAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      lastConnections: {
        type: DataTypes.ARRAY(DataTypes.DATE),
        allowNull: false,
        defaultValue: [],
      },
      isBanned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'UnregisteredDevice',
      tableName: 'UnregisteredDevices',
    }
  );
  return UnregisteredDevice;
}