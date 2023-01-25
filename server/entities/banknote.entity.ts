import { BuildOptions, DataTypes, DATE, JSONB, Model, ModelAttributes, Sequelize, UUIDV4 } from "sequelize";
import * as uuid from 'uuid';
import { IBankNote } from "./system.model";

interface IBankNoteAttribute extends IBankNote {
}
export interface BankNoteModel extends Model<IBankNoteAttribute>, IBankNoteAttribute {

}
export class BankNote extends Model<BankNoteModel, IBankNoteAttribute> { }

export type BankNoteStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): BankNoteModel;
};

export const BankNoteFactory = (name: string, sequelize: Sequelize):BankNoteStatic => {
    const attributes: ModelAttributes<BankNoteModel> = {
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
        name:{
            type: DataTypes.STRING,
        },
        image: {
            type: DataTypes.TEXT,
        },
        price:{
            type: DataTypes.FLOAT,
        },
        qtty: {
            type: DataTypes.FLOAT,
        },
        hasM: {
            type: DataTypes.TEXT,
        },
        hashP: {
            type: DataTypes.TEXT,
        }

    } as ModelAttributes<BankNoteModel>;

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
    return x as unknown as BankNoteStatic;
}