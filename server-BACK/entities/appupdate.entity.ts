import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";
// Sequelize model definition
export interface IBundle {
    id?: string;
    uuid?: string;
    isActive?: boolean;
    bundleId: string;
    filePath: string;
    channel: string;
    name: string;
    description: any;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface BundleAttributes extends IBundle { }
export interface BundleModel extends Model<BundleAttributes>, BundleAttributes { }
export type BundleStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): BundleModel;
}

export let BundleFactory = (name: string, con: Sequelize): any => {
    const attributes: ModelAttributes<BundleModel> = {
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
            defaultValue: DataTypes.UUIDV4
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        bundleId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        filePath: {
            type: DataTypes.STRING,
            allowNull: false
        },
        channel: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE
        },
        updatedAt: {
            type: DataTypes.DATE
        }
    } as ModelAttributes<BundleModel>;

    let x = con.define(name, attributes, { tableName: name, freezeTableName: true, timestamps: true });
    return x;
};