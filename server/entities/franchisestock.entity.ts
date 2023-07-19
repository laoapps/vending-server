import { BuildOptions, DataTypes, DATE, JSONB, Model, ModelAttributes, Sequelize, UUIDV4 } from "sequelize";
import * as uuid from 'uuid';
import { IFranchiseStock } from "./system.model";

interface IFranchiseStockAttribute extends IFranchiseStock {
}
export interface FranchiseStockModel extends Model<IFranchiseStockAttribute>, IFranchiseStockAttribute {

}
export class FranchiseStock extends Model<FranchiseStockModel, IFranchiseStockAttribute> { }

export type FranchiseStockStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): FranchiseStockModel;
};

export const FranchiseStockFactory = (name: string, sequelize: Sequelize):FranchiseStockStatic => {
    const attributes: ModelAttributes<FranchiseStockModel> = {
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
        hashP:{
            type: DataTypes.STRING,
        },
        hashM: {
            type: DataTypes.STRING,
        },
        data:{
            type: DataTypes.JSONB,
        }

    } as ModelAttributes<FranchiseStockModel>;

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
    return x as unknown as FranchiseStockStatic;
}