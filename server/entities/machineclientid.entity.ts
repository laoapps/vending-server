import { BuildOptions, DataTypes, DATE, json, JSONB, Model, ModelAttributes, Sequelize, UUIDV4 } from "sequelize";
import * as uuid from 'uuid';
import { IMachineClientID } from "./system.model";

interface IMachineClientIDAttribute extends IMachineClientID {
}
export interface MachineClientIDModel extends Model<IMachineClientIDAttribute>, IMachineClientIDAttribute {

}
export class MachineClientID extends Model<MachineClientIDModel, IMachineClientIDAttribute> { }

export type MachineClientIDStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): MachineClientIDModel;
};

export const MachineClientIDFactory = (name: string, sequelize: Sequelize): MachineClientIDStatic => {
    const attributes: ModelAttributes<MachineClientIDModel> = {
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
         photo: {
            type: DataTypes.TEXT,
        },
        // hasM: {
        //     type: DataTypes.TEXT,
        // },
        // hashP: {
        //     type: DataTypes.TEXT,
        // },
        machineId: {
            type: DataTypes.STRING,
        },
        otp: {
            type: DataTypes.STRING,
        },
        ownerUuid:{
            type: DataTypes.STRING,
        },

    } as ModelAttributes<MachineClientIDModel>;

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
        if(!o.uuid)
        o.uuid = uuid.v4();
        // o.deletedAt = undefined;
    });
    return x as unknown as MachineClientIDStatic;
}