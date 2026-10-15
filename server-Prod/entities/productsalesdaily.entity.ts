import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";

/**
 * Accumulated sales: one row per owner / machine / day / channel(position) / product.
 * Rebuilt from vendingmachinebill_<ownerUuid> by services/productSalesAnalytics.ts,
 * so it is always safe to delete and rebuild any day.
 */
export interface IProductSalesDaily {
    id?: number;
    ownerUuid: string;
    machineId: string;
    saleDate: string; // YYYY-MM-DD in server time zone
    position: number;
    productKey: string; // normalized product name, used to group across machines/owners
    productId: number;
    productName: string;
    productImage: string;
    price: number;
    qty: number;
    amount: number;
    billCount: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ProductSalesDailyModel extends Model<IProductSalesDaily>, IProductSalesDaily { }

export type ProductSalesDailyStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): ProductSalesDailyModel;
};

export const ProductSalesDailyFactory = (name: string, sequelize: Sequelize): ProductSalesDailyStatic => {
    const attributes: ModelAttributes<ProductSalesDailyModel> = {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        ownerUuid: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        machineId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        saleDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        position: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        productKey: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        productId: {
            type: DataTypes.INTEGER,
        },
        productName: {
            type: DataTypes.STRING,
        },
        productImage: {
            type: DataTypes.TEXT,
        },
        price: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        qty: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        amount: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        billCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    } as ModelAttributes<ProductSalesDailyModel>;

    const x = sequelize.define(name, attributes, {
        tableName: name,
        freezeTableName: true,
        indexes: [
            { fields: ['ownerUuid', 'saleDate'] },
            { fields: ['machineId', 'saleDate'] },
            { fields: ['saleDate'] },
            { fields: ['productKey'] },
        ],
    });
    return x as unknown as ProductSalesDailyStatic;
}
