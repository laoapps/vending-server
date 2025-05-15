import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";
import { IKioskBlock } from "../versioncontrol/models/base.model";


export interface KioskBlockAttributes extends IKioskBlock { }
export interface KioskBlockModel extends Model<KioskBlockAttributes>, KioskBlockAttributes { }
export type KioskBlockStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): KioskBlockModel;
}

export let KioskBlockFactory = (name: string, con: Sequelize): any => {
    const attributes: ModelAttributes<KioskBlockModel, KioskBlockAttributes> = {
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
        header: {
            type: DataTypes.JSONB,
            allowNull: false
        },
        file: {
            type: DataTypes.JSONB,
            allowNull: false
        },
        version: {
            type: DataTypes.STRING(11),
            allowNull: false,
            defaultValue: ''
        },
        readme: {
            type: DataTypes.JSONB,
            allowNull: false
        }
    } as ModelAttributes<KioskBlockModel>;
    let x = con.define(name, attributes, { tableName: name, freezeTableName: true, timestamps: true });
    return x;
}