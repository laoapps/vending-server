import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";

export interface IVendingCashoutMMoney {
    id?: number,
    uuid?: string,
    isActive?: boolean,
    ownerUuid: string,
    data: {
        phonenumber: string,
        transactionID: string,
        cashInValue: number,
        description: string,
        machineId: string
    }
    LAAB: {
        hash: string,
        info: string
    },
    LAABReturn: {},
    MMoney: any,
}
export interface VendingCashoutMMoneyAttributes extends IVendingCashoutMMoney { }
export interface VendingCashoutMMoneyModel extends Model<VendingCashoutMMoneyAttributes>, VendingCashoutMMoneyAttributes { }
export type VendingCashoutMMoneyStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): VendingCashoutMMoneyModel;
}

export let VendingCashoutMMoneyFactory = (name: string, con: Sequelize): any => {
    const attributes: ModelAttributes<VendingCashoutMMoneyModel> = {
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
        LAAB: {
            type: DataTypes.JSONB
        },
        MMoney: {
            type: DataTypes.JSONB
        }
    } as ModelAttributes<VendingCashoutMMoneyModel>;
    let x = con.define(name, attributes, { tableName: name, freezeTableName: true, timestamps: true });
    return x;
}