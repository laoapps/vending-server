import { BuildOptions, DataTypes, DATE, JSONB, Model, ModelAttributes, Sequelize, UUIDV4 } from "sequelize";
import * as uuid from 'uuid';
import { IVendingMachineBill } from "./system.model";

interface VendingMachineBillAttribute extends IVendingMachineBill {
}
export interface VendingMachineBillModel extends Model<VendingMachineBillAttribute>, VendingMachineBillAttribute {

}
export class VendingMachineBill extends Model<VendingMachineBillModel, VendingMachineBillAttribute> { }

export type VendingMachineBillStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): VendingMachineBillModel;
};

export const VendingMachineBillFactory = (name: string, sequelize: Sequelize):VendingMachineBillStatic => {
    const attributes: ModelAttributes<VendingMachineBillModel> = {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            unique: true,
            autoIncrement: true,
            autoIncrementIdentity: true
        },
        uuid: {
            allowNull: false,
            unique: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        vendingsales: {
            type: DataTypes.JSONB,
        },
        totalvalue: {
            type: DataTypes.FLOAT,
        },
        paymentmethod:  {
            type: DataTypes.STRING,
        },
        paymentstatus:  {
            type: DataTypes.STRING,
        },
        paymentref:  {
            type: DataTypes.STRING,
        },
        paymenttime:  {
            type: DataTypes.DATE,
        },
        requestpaymenttime: {
            type: DataTypes.DATE,
        },
        machineId:  {
            type: DataTypes.STRING,
        },
        clientId:  {
            type: DataTypes.STRING,
        },
        transactionID:  {
            type: DataTypes.FLOAT,
        },
        qr:  {
            type: DataTypes.STRING,
        },
        hasM: {
            type: DataTypes.TEXT,
        },
        hashP: {
            type: DataTypes.TEXT,
        }

    } as ModelAttributes<VendingMachineBillModel>;

    const x = sequelize.define(name, attributes, { tableName: name, freezeTableName: true });
    x.beforeUpdate(async (o, options) => {
        if (o.changed('uuid')) {
            o.uuid = o.previous().uuid;
        }
        if (o.changed('id')) {
            o.id = o.previous().id;
        }
        o.createdAt = o.previous().createdAt;
        o.updatedAt = new Date();
    });
    x.beforeCreate(async (o) => {
        o.uuid = uuid.v4();
        // o.deletedAt = undefined;
    });
    return x as unknown as VendingMachineBillStatic;
}