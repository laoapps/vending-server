import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";
import { ISubadmin } from "./system.model";


export interface SubadminAttributes extends ISubadmin { }
export interface SubadminModel extends Model<SubadminAttributes>, SubadminAttributes { }
export type SubadminStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): SubadminModel;
}

export let SubadminFactory = (name: string, con: Sequelize): any => {
    const attributes: ModelAttributes<SubadminModel> = {
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
        ownerUuid: {
            type: DataTypes.STRING,
        },
        data: {
            type: DataTypes.JSONB,
            allowNull: false
        },
        provides: {
            type: DataTypes.JSONB
        }   
    } as ModelAttributes<SubadminModel>;
    let x = con.define(name, attributes, { tableName: name, freezeTableName: true, timestamps: true });
    return x;
}