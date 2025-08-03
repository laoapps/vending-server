import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";

import * as uuid from 'uuid';
import { IProductImage } from "../models/sys.model";
interface ProductImageAttribute extends IProductImage {
}

export interface ProductImageModel extends Model<ProductImageAttribute>, ProductImageAttribute {

}
export class ProductImage extends Model<ProductImageModel, ProductImageAttribute> { }
export type ProductImageStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): ProductImageModel;
};
export const ProductImageFactory = (name: string, sequelize: Sequelize): ProductImageStatic => {
    const attributes: ModelAttributes<ProductImageModel> = {
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
        imageURL: {
            type: DataTypes.STRING,
        },
        name: {
            type: DataTypes.STRING,
        },
        price: {
            type: DataTypes.DECIMAL,
            defaultValue: 0
        },
        description: {
            type: DataTypes.JSONB,
        }


    } as ModelAttributes<ProductImageModel>;

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