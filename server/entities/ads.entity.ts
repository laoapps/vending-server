import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";
import { IAds } from "./system.model";

export interface AdsAttributes extends IAds { }
export interface AdsModel extends Model<AdsAttributes>, AdsAttributes { }
export type AdsStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): AdsModel;
}

export let AdsFactory = (name: string, con: Sequelize): any => {
    const attributes: ModelAttributes<AdsModel> = {
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
        name: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.STRING
        },
        machines: {
            type: DataTypes.JSONB
        },
        adsMedia: {
            type: DataTypes.JSONB
        }   
    } as ModelAttributes<AdsModel>;
    let x = con.define(name, attributes, { tableName: name, freezeTableName: true, timestamps: true });
    return x;
}