import { BuildOptions, DataTypes, DATE, JSONB, Model, ModelAttributes, Sequelize, UUIDV4 } from "sequelize";
import * as uuid from 'uuid';
import { } from "./system.model";
import { ILogsTemp } from "../models/sys.model";

interface ILogsTempAttribute extends ILogsTemp {
}
export interface LogsTempModel extends Model<ILogsTempAttribute>, ILogsTempAttribute {

}
export class LogsTemp extends Model<LogsTempModel, ILogsTempAttribute> { }

export type LogsTempStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): LogsTempModel;
};

export const LogsTempFactory = (name: string, sequelize: Sequelize): LogsTempStatic => {
    const attributes: ModelAttributes<LogsTempModel> = {
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
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        machineId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        mstatus: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        description: {
            type: DataTypes.JSONB,
        }
    } as ModelAttributes<LogsTempModel>;

    const x = sequelize.define(name, attributes, { tableName: name, freezeTableName: true });
    x.beforeUpdate(async (o, options) => {
        if (o.changed('uuid')) {
            o.uuid = o.previous().uuid;
        }
        if (o.changed('id')) {
            o.id = o.previous().id;
        }
        o.createdAt = o.previous().createdAt;
    });
    x.beforeCreate(async (o) => {
        if (!o.uuid)
            o.uuid = uuid.v4();
        // o.deletedAt = undefined;
    });
    return x as unknown as LogsTempStatic;
}