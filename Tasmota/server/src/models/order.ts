import { Sequelize, DataTypes, Model } from 'sequelize';

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


  userUuid:string;
  data:any;
  relay:number
}

export class Order extends Model<OrderAttributes> {
  // No public class fields, which is correct
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
      },
      packageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      paidTime: { type: DataTypes.DATE, allowNull: true },
      startedTime: { type: DataTypes.DATE, allowNull: true },
      completedTime: { type: DataTypes.DATE, allowNull: true },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,

      userUuid:DataTypes.STRING,
      data:DataTypes.JSONB,
      relay:DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: 'Order',
      tableName: 'orders',
    }
  );
  return Order;
}