import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";

import * as uuid from 'uuid';
import { IClientlog } from "../models/sys.model";
interface ClientlogAttribute extends IClientlog {
}

export interface ClientlogModel extends Model<ClientlogAttribute>, ClientlogAttribute {

}
export class Clientlog extends Model<ClientlogModel, ClientlogAttribute> { }
export type ClientlogStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): ClientlogModel;
};
export const ClientlogFactory = (name: string, sequelize: Sequelize): ClientlogStatic => {
    const attributes: ModelAttributes<ClientlogModel> = {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            unique: true,
            autoIncrement: true,
            autoIncrementIdentity: true
        },
        uuid: {
            unique: true,
            allowNull: false,
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
        machineId: {
            type: DataTypes.STRING(50),
        },
        errorLog: {
            type: DataTypes.JSONB,
        },
        description: {
            type: DataTypes.JSONB,
        }


    } as ModelAttributes<ClientlogModel>;

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