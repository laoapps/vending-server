import { BuildOptions, DataTypes, DATE, JSONB, Model, ModelAttributes, Sequelize, UUIDV4 } from "sequelize";
import * as uuid from 'uuid';
import { IMachineSale } from "./system.model";

interface IMachineSaleAttribute extends IMachineSale {
}
export interface MachineSaleModel extends Model<IMachineSaleAttribute>, IMachineSaleAttribute {

}
export class MachineSale extends Model<MachineSaleModel, IMachineSaleAttribute> { }

export type MachineSaleStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): MachineSaleModel;
};

export const MachineSaleFactory = (name: string, sequelize: Sequelize):MachineSaleStatic => {
    const attributes: ModelAttributes<MachineSaleModel> = {
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
        machineId:{
            type: DataTypes.STRING,
        },
        sale:{
            type: DataTypes.JSONB,
        }
    } as ModelAttributes<MachineSaleModel>;

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
    return x as unknown as MachineSaleStatic;
}