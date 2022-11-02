import { BuildOptions, DataTypes, DATE, JSONB, Model, ModelAttributes, Sequelize, UUIDV4 } from "sequelize";
import * as uuid from 'uuid';
import { IStock } from "./system.model";

interface IStockAttribute extends IStock {
}
export interface StockModel extends Model<IStockAttribute>, IStockAttribute {

}
export class Stock extends Model<StockModel, IStockAttribute> { }

export type StockStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): StockModel;
};

export const StockFactory = (name: string, sequelize: Sequelize):any => {
    const attributes: ModelAttributes<StockModel> = {
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
        name:{
            type: DataTypes.STRING,
        },
        image: {
            type: DataTypes.TEXT,
        },
        price:{
            type: DataTypes.FLOAT,
        },
        qtty: {
            type: DataTypes.FLOAT,
        },
        hasM: {
            type: DataTypes.TEXT,
        },
        hashP: {
            type: DataTypes.TEXT,
        }

    } as ModelAttributes<StockModel>;

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
    return x;
}