import { BuildOptions, DataTypes, DATE, JSONB, Model, ModelAttributes, Sequelize, UUIDV4 } from "sequelize";
import * as uuid from 'uuid';
import { IProductCredit } from "./system.model";

interface IProductCreditAttribute extends IProductCredit {
}
export interface ProductCreditModel extends Model<IProductCreditAttribute>, IProductCreditAttribute {

}
export class ProductCredit extends Model<ProductCreditModel, IProductCreditAttribute> { }

export type ProductCreditStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): ProductCreditModel;
};

export const ProductCreditFactory = (name: string, sequelize: Sequelize): ProductCreditStatic => {
    const attributes: ModelAttributes<ProductCreditModel> = {
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
        ownerUuid: {
            type: DataTypes.STRING,
        },
        productUuid: {
            type: DataTypes.STRING,
        },
        creditType: {
            type: DataTypes.STRING,
        },
        creditValue: {
            type: DataTypes.DECIMAL,
        },
        creditAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        creditBy: {
            type: DataTypes.STRING,
        },
        description: {
            type: DataTypes.JSONB,
            defaultValue: {}
        }
    } as ModelAttributes<ProductCreditModel>;

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
    return x as unknown as ProductCreditStatic;
}