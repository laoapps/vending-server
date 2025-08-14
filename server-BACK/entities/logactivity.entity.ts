import { BuildOptions, DataTypes, DATE, JSONB, Model, ModelAttributes, Sequelize, UUIDV4 } from "sequelize";
import * as uuid from 'uuid';
import { ILogActivity } from "./system.model";

interface ILogActivityAttribute extends ILogActivity {
}
export interface LogActivityModel extends Model<ILogActivityAttribute>, ILogActivityAttribute {

}
export class LogActivity extends Model<LogActivityModel, ILogActivityAttribute> { }

export type LogActivityStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): LogActivityModel;
};

export const LogActivityFactory = (name: string, sequelize: Sequelize):LogActivityStatic => {
    const attributes: ModelAttributes<LogActivityModel> = {
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
        ownerUuid:{
            type: DataTypes.STRING,
        },
        superadmin:{
            type: DataTypes.STRING,
        },
        subadmin:{
            type: DataTypes.STRING,
        },
        url:{
            type: DataTypes.STRING,
        },
        body:{
            type: DataTypes.JSONB,
        },
        error:{
            type: DataTypes.BOOLEAN,
        }
    } as ModelAttributes<LogActivityModel>;

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
    return x as unknown as LogActivityStatic;
}