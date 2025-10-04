import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";
import { IVendingEventLog } from "./system.model";

export interface VendingEventLogAttributes extends IVendingEventLog { }
export interface VendingEventLogModel extends Model<VendingEventLogAttributes>, VendingEventLogAttributes { }
export type VendingEventLogStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): VendingEventLogModel;
}

export let VendingEventLogFactory = (name: string, con: Sequelize): any => {
    const attributes: ModelAttributes<VendingEventLogModel> = {
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
        machineId: {
            type: DataTypes.STRING,
            allowNull: false,
        },  
        event: {
            type: DataTypes.STRING
        },
        data: {
            type: DataTypes.JSONB
        },
        date: {
            type: DataTypes.INTEGER, // Changed from NUMBER to INTEGER
            allowNull: false,
        },
        month: {
            type: DataTypes.INTEGER, // Changed from NUMBER to INTEGER
            allowNull: false,
        },
        year: {
            type: DataTypes.INTEGER, // Changed from NUMBER to INTEGER
            allowNull: false,
        }
    } as ModelAttributes<VendingEventLogModel>;
    let x = con.define(name, attributes, { tableName: name, freezeTableName: true, timestamps: true });
    return x;
}