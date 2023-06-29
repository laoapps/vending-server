import { BuildOptions, DataTypes, DATE, JSONB, Model, ModelAttributes, Sequelize, UUIDV4 } from "sequelize";
import * as uuid from 'uuid';
import { IBillCashIn } from "./system.model";

interface IBillCashInAttribute extends IBillCashIn {
}
export interface BillCashInModel extends Model<IBillCashInAttribute>, IBillCashInAttribute {

}
export class BillCashIn extends Model<BillCashInModel, IBillCashInAttribute> { }

export type BillCashInStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): BillCashInModel;
};

export const BillCashInFactory = (name: string, sequelize: Sequelize):BillCashInStatic => {
    const attributes: ModelAttributes<BillCashInModel> = {
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
            defaultValue: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        bankNotes:{
            type: DataTypes.JSONB,
        },
        badBankNotes: {
            type: DataTypes.JSONB,
        },
        transactionID:{
            type: DataTypes.FLOAT,
        },
        userUuid: {
            type: DataTypes.STRING,
        },
        requestor: {
            type: DataTypes.JSONB,
        },
        requestTime: {
            type: DataTypes.DATE,
        }
        ,
        confirm: {
            type: DataTypes.JSONB,
        }
        ,
        confirmTime: {
            type: DataTypes.DATE,
        }
        ,
        clientId: {
            type: DataTypes.STRING,
        }
        ,
        machineId: {
            type: DataTypes.STRING,
        }
       

    } as ModelAttributes<BillCashInModel>;

    const x = sequelize.define(name, attributes, { tableName: name, freezeTableName: true });
    x.beforeUpdate(async (o, options) => {
        if (o.changed('uuid')) {
            o.uuid = o.previous().uuid;
        }
        if (o.changed('id')) {
            o.id = o.previous().id;
        }
        o.createdAt = o.previous().createdAt;
        o.updatedAt = new Date();
    });
    x.beforeCreate(async (o) => {
        if(!o.uuid)
        o.uuid = uuid.v4();
        // o.deletedAt = undefined;
    });
    return x as unknown as BillCashInStatic;
}