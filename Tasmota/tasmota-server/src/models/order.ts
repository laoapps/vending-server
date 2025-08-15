import { Sequelize, DataTypes, Model, BelongsToGetAssociationMixin } from 'sequelize';
import { SchedulePackage } from './schedulePackage';
import { Device } from './device';

export interface OrderAttributes {
  id: number;
  uuid: string;
  deviceId: number;
  packageId: number;
  paidTime: Date;
  startedTime: Date;
  completedTime: Date;
  createdAt: Date;
  updatedAt: Date;
  userUuid: string;
  data: any;
  relay: number;
  conditionValue: number;
}

export interface OrderAssociations {
  package: SchedulePackage;
  device: Device;
}

// export class Order extends Model<OrderAttributes, OrderAssociations> {
//   declare getPackage: BelongsToGetAssociationMixin<SchedulePackage>;
//   declare getDevice: BelongsToGetAssociationMixin<Device>;
// }

export class Order extends Model<OrderAttributes, OrderAssociations> implements OrderAttributes {
  declare id: number;
  declare uuid: string;
  declare deviceId: number;
  declare packageId: number;
  declare paidTime: Date;
  declare startedTime: Date;
  declare completedTime: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare userUuid: string;
  declare data: any;
  declare relay: number;
  declare conditionValue: number;

  // Associations
  declare getPackage: BelongsToGetAssociationMixin<SchedulePackage>;
  declare getDevice: BelongsToGetAssociationMixin<Device>;
}


export function initOrderModel(sequelize: Sequelize) {
  Order.init(
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
      deviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'devices', key: 'id' },
      },
      packageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      conditionValue: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      paidTime: { type: DataTypes.DATE, allowNull: true },
      startedTime: { type: DataTypes.DATE, allowNull: true },
      completedTime: { type: DataTypes.DATE, allowNull: true },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      userUuid: DataTypes.STRING,
      data: DataTypes.JSONB,
      relay: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'Order',
      tableName: 'orders',
    }
  );
  return Order;
}