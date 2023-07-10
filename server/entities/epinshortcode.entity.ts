import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";

export interface IEPINShortCode {
    id?: number,
    uuid?: string,
    isActive?: boolean,
    creator: string, // vending uuid
    phonenumber: string,
    SMC: any,
    EPIN: {
        destination: any,
        coinname: string,
        name: string
    },
    counter: {
        cash: {
            hash: string,
            info: string
        }
    }
}
export interface EPINShortCodeAttributes extends IEPINShortCode { }
export interface EPINShortCodeModel extends Model<EPINShortCodeAttributes>, EPINShortCodeAttributes { }
export type EPINShortCodeStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): EPINShortCodeModel;
}

export let EPINShortCodeFactory = (name: string, con: Sequelize): any => {
    const attributes: ModelAttributes<EPINShortCodeModel> = {

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
        creator: {
            type: DataTypes.STRING,
        },
        phonenumber: {
            type: DataTypes.STRING,
        },
        SMC: {
            type: DataTypes.JSONB,
        },
        EPIN: {
            type: DataTypes.JSONB,
        },
        counter: {
            type: DataTypes.JSONB,
        }

    } as ModelAttributes<EPINShortCodeModel>
    let x = con.define(name, attributes, { tableName: name, freezeTableName: true, timestamps: true });
    return x;
}