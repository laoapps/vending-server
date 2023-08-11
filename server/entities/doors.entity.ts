import { BuildOptions, DataTypes, DATE, JSONB, Model, ModelAttributes, Sequelize, UUIDV4 } from "sequelize";
import * as uuid from 'uuid';
import { IDoor } from "./system.model";

interface IDoorAttribute extends IDoor {
}
export interface DoorModel extends Model<IDoorAttribute>, IDoorAttribute {

}
export class Door extends Model<DoorModel, IDoorAttribute> { }

export type DoorStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): DoorModel;
};

export const DoorFactory = (name: string, sequelize: Sequelize): DoorStatic => {
    const attributes: ModelAttributes<DoorModel> = {
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
            type: DataTypes.FLOAT,
        },
        cabinetNumber: {
            type: DataTypes.FLOAT,
        },
        data: {
            type: DataTypes.JSONB,
        },
        isDone: {
            type: DataTypes.BOOLEAN,
        },
        depositBy: {
            type: DataTypes.STRING,
        },
        depositAt: {
            type: DataTypes.DATE,
        },
        sendBy: {
            type: DataTypes.STRING,
        },
        sentAt: {
            type: DataTypes.DATE,
        },
        minValue: {
            type: DataTypes.FLOAT,
        },
        maxValue: {
            type: DataTypes.FLOAT,
        }

    } as ModelAttributes<DoorModel>;

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
    return x as unknown as DoorStatic;
}