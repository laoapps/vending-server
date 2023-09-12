import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";
import { IVendingVersion } from "./system.model";


export interface VendingVersionAttributes extends IVendingVersion { }
export interface VendingVersionModel extends Model<VendingVersionAttributes>, VendingVersionAttributes { }
export type VendingVersionStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): VendingVersionModel;
}

export let VendingVersionFactory = (name: string, con: Sequelize): any => {
    const attributes: ModelAttributes<VendingVersionModel, VendingVersionAttributes> = {
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
            allowNull: false,
            defaultValue: true
        },
        url: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        version: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT
        }
    } as ModelAttributes<VendingVersionModel>;
    let x = con.define(name, attributes, { tableName: name, freezeTableName: true, timestamps: true });
    return x;
}