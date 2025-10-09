import { BuildOptions, DataTypes, DATE, json, JSONB, Model, ModelAttributes, Sequelize, UUIDV4 } from "sequelize";
import * as uuid from 'uuid';
import { IRecordBilling } from "./system.model";

interface IRecordBillingAttribute extends IRecordBilling {
}
export interface RecordBillingModel extends Model<IRecordBillingAttribute>, IRecordBillingAttribute {

}
export class RecordBilling extends Model<RecordBillingModel, IRecordBillingAttribute> { }

export type RecordBillingStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): RecordBillingModel;
};

export const RecordBillingFactory = (name: string, sequelize: Sequelize): RecordBillingStatic => {
    const attributes: ModelAttributes<RecordBillingModel> = {
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
        superadmin: {
            type: DataTypes.STRING,
        },
        ownerUuid: {
            type: DataTypes.STRING,
        },
        machineId: {
            type: DataTypes.STRING,
        },
        startDate: {
            type: DataTypes.DATE,
        },
        endDate: {
            type: DataTypes.DATE,
        },
        processType: {
            type: DataTypes.STRING
        },
        result: {
            type: DataTypes.JSONB,
        },
        description: {
            type: DataTypes.JSONB,
        },

    } as ModelAttributes<RecordBillingModel>;

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
    return x as unknown as RecordBillingStatic;
}