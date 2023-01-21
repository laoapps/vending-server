import { BuildOptions, DataTypes, DATE, JSONB, Model, ModelAttributes, Sequelize, UUIDV4 } from "sequelize";
import * as uuid from 'uuid';
import { IMachineID } from "./system.model";

interface MachineIDAttribute extends IMachineID {
}
export interface MachineIDModel extends Model<MachineIDAttribute>, MachineIDAttribute {

}
export class MachineID extends Model<MachineIDModel, MachineIDAttribute> { }

export type MachineIDStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): MachineIDModel;
};

export const MachineIDFactory = (name: string, sequelize: Sequelize): MachineIDModel => {
    const attributes: ModelAttributes<MachineIDModel> = {
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
        machineId: {
            type: DataTypes.STRING,
        },
        machineIp: {
            type: DataTypes.STRING,
        },
        machineCommands: {
            type: DataTypes.STRING,
        },
        logintoken: {
            type: DataTypes.TEXT,
        },
        bill: {
            type: DataTypes.JSONB,
        },
        hasM: {
            type: DataTypes.TEXT,
        },
        hashP: {
            type: DataTypes.TEXT,
        }

    } as ModelAttributes<MachineIDModel>;

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
    return x as unknown as MachineIDModel;
}