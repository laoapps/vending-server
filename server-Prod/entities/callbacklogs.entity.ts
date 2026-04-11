import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";

import * as uuid from 'uuid';
import { ICallbacklog } from "../models/sys.model";
interface CallbacklogAttribute extends ICallbacklog {
}

export interface CallbacklogModel extends Model<CallbacklogAttribute>, CallbacklogAttribute {

}
export class Callbacklog extends Model<CallbacklogModel, CallbacklogAttribute> { }
export type CallbacklogStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): CallbacklogModel;
};
export const CallbacklogFactory = (name: string, sequelize: Sequelize): CallbacklogStatic => {
    const attributes: ModelAttributes<CallbacklogModel> = {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            unique: true,
            autoIncrement: true,
            autoIncrementIdentity: true
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        machineId: {
            type: DataTypes.STRING(50),
        },
        transactionId: {
            type: DataTypes.STRING,
        },
        part: {
            type: DataTypes.STRING,
        },
        errorLog: {
            type: DataTypes.JSONB,
        },
        description: {
            type: DataTypes.JSONB,
        }


    } as ModelAttributes<CallbacklogModel>;

    let x = sequelize.define(name, attributes, { tableName: name, freezeTableName: true });
    x.beforeUpdate(async (o, options) => {
        if (o.changed('uuid')) {
            o.uuid = o.previous().uuid;
        }
        if (o.changed('id')) {
            o.id = o.previous().id;
        }
        o.createdAt = o.previous().createdAt;
        o.updatedAt = new Date(); // UPDATE TO UTC+7;
    });
    x.beforeCreate(async (o) => {
        o.uuid = uuid.v4();
        //o.deletedAt = undefined;
    });
    return x as any;
}