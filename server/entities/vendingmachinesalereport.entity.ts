import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";

export interface IVendingMachineSaleReport {
    id?: number,
    uuid?: string,
    isActive?: boolean,
    machineId: string,
    data: any,
    subqty: number,
    subtotal: number
}
export interface VendingMachineSaleReportAttributes extends IVendingMachineSaleReport { }
export interface VendingMachineSaleReportModel extends Model<VendingMachineSaleReportAttributes>, VendingMachineSaleReportAttributes { }
export type VendingMachineSaleReportStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): VendingMachineSaleReportModel;
}

export let VendingMachineSaleReportFactory = (name: string, con: Sequelize): any => {
    const attributes: ModelAttributes<VendingMachineSaleReportModel> = {

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
            type: DataTypes.STRING(50),
        },
        data: {
            type: DataTypes.JSONB,
        },
        subqty: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        subtotal: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        }

    } as ModelAttributes<VendingMachineSaleReportModel>
    let x = con.define(name, attributes, { tableName: name, freezeTableName: true, timestamps: true });
    return x;
}