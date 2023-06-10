import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";

export interface IVendingWallet {
    id?: number,
    uuid?: string,
    ownerUuid:string;
    // walletUuid:string;
    walletType:string;// limitter, Merchant, machine
    machineClientId:string;
    passkeys:string;
    username:string;
    platform:string;
    coinListId: string;
    coinCode: string;
    coinName: string;
}
export interface VendingWalletAttributes extends IVendingWallet { }
export interface VendingWalletModel extends Model<VendingWalletAttributes>, VendingWalletAttributes { }
export type VendingWalletStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): VendingWalletModel;
}

export let VendingWalletFactory = (name: string, con: Sequelize): any => {
    const attributes: ModelAttributes<VendingWalletModel> = {

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
        ownerUuid: {
            type: DataTypes.STRING,
        },
        walletType: {
            type: DataTypes.STRING,
        },
        machineClientId: {
            type: DataTypes.STRING,
        },
        passkeys: {
            type: DataTypes.STRING,
        },
        username: {
            type: DataTypes.STRING,
        },
        platform: {
            type: DataTypes.STRING,
        },
        coinListId: {
            type: DataTypes.STRING
        },
        coinCode: {
            type: DataTypes.STRING
        },
        coinName: {
            type: DataTypes.STRING
        }

    } as ModelAttributes<VendingWalletModel>
    let x = con.define(name, attributes, { tableName: name, freezeTableName: true, timestamps: true });
    return x;
}