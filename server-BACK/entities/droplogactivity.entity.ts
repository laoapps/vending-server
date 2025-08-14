import { BuildOptions, DataTypes, DATE, JSONB, Model, ModelAttributes, Sequelize, UUIDV4 } from "sequelize";
import * as uuid from 'uuid';
import { IDropLogActivity } from "./system.model";

interface IDropLogActivityAttribute extends IDropLogActivity {
}
export interface DropLogActivityModel extends Model<IDropLogActivityAttribute>, IDropLogActivityAttribute {

}
export class DropLogActivity extends Model<DropLogActivityModel, IDropLogActivityAttribute> { }

export type DropLogActivityStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): DropLogActivityModel;
};

export const DropLogActivityFactory = (name: string, sequelize: Sequelize): DropLogActivityStatic => {
    const attributes: ModelAttributes<DropLogActivityModel> = {
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
        status: {
            type: DataTypes.STRING,
        },
        body: {
            type: DataTypes.JSONB,
        }
    } as ModelAttributes<DropLogActivityModel>;

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
    return x as unknown as DropLogActivityStatic;
}