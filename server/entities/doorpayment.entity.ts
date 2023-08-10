import { BuildOptions, DataTypes, DATE, JSONB, Model, ModelAttributes, Sequelize, UUIDV4 } from "sequelize";
import * as uuid from 'uuid';
import { IDoorPayment } from "./system.model";

interface IDoorPaymentAttribute extends IDoorPayment {
}
export interface DoorPaymentModel extends Model<IDoorPaymentAttribute>, IDoorPaymentAttribute {

}
export class DoorPayment extends Model<DoorPaymentModel, IDoorPaymentAttribute> { }

export type DoorPaymentStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): DoorPaymentModel;
};

export const DoorPaymentFactory = (name: string, sequelize: Sequelize): DoorPaymentStatic => {
    const attributes: ModelAttributes<DoorPaymentModel> = {
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
        
        ownerUuid: {
            type: DataTypes.STRING,
        },
        machineId: {
            type: DataTypes.STRING,
        },
    door: {
            type: DataTypes.JSONB,
        },
        doorNumber: {
            type: DataTypes.NUMBER,
        },
        cabinetNumber: {
            type: DataTypes.NUMBER,
        },
        productUuid: {
            type: DataTypes.STRING,
        },
        orderUuid: {
            type: DataTypes.STRING,
        },
        price: {
            type: DataTypes.NUMBER,
        },
        isPaid: {
            type: DataTypes.BOOLEAN,
        },
        LAABRef: {
            type: DataTypes.JSONB,
        },
        paymentRef: {
            type: DataTypes.JSONB,
        }

    } as ModelAttributes<DoorPaymentModel>;

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
        if (!o.uuid)
            o.uuid = uuid.v4();
        // o.deletedAt = undefined;
    });
    return x as unknown as DoorPaymentStatic;
}