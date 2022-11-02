// import { BuildOptions, DataTypes, DATE, JSONB, Model, ModelAttributes, Sequelize, UUIDV4 } from "sequelize";
// import * as uuid from 'uuid';
// import { IVendingMachineBill } from "./system.model";

// interface VendingMachineBillAttribute extends IVendingMachineBill {
// }
// export interface VendingMachineModel extends Model<VendingMachineBillAttribute>, VendingMachineBillAttribute {

// }
// export class VendingMachine extends Model<VendingMachineModel, VendingMachineBillAttribute> { }

// export type VendingMachineStatic = typeof Model & {
//     new(values?: object, options?: BuildOptions): VendingMachineModel;
// };

// export const VendingMachineFactory = (name: string, sequelize: Sequelize): VendingMachineStatic => {
//     const attributes: ModelAttributes<VendingMachineModel> = {
//         id: {
//             type: DataTypes.INTEGER,
//             primaryKey: true,
//             unique: true,
//             autoIncrement: true,
//             autoIncrementIdentity: true
//         },
//         uuid: {
//             allowNull: false,
//             unique: true,
//             type: DataTypes.UUID,
//             defaultValue: DataTypes.UUIDV4,
//         },
//         isActive: {
//             type: DataTypes.BOOLEAN,
//             defaultValue: true,
//         },
//         createdAt: {
//             type: DataTypes.DATE,
//             defaultValue: DataTypes.NOW
//         },
//         updatedAt: {
//             type: DataTypes.DATE,
//             defaultValue: DataTypes.NOW,
//         },
//         hasM: {
//             type: DataTypes.TEXT,
//         },
//         hashP: {
//             type: DataTypes.TEXT,
//         }

//     } as ModelAttributes<VendingMachineModel>;

//     const x = sequelize.define(name, attributes, { tableName: name, freezeTableName: true });
//     x.beforeUpdate(async (o, options) => {
//         if (o.changed('uuid')) {
//             o.uuid = o.previous().uuid;
//         }
//         if (o.changed('id')) {
//             o.id = o.previous().id;
//         }
//         o.createdAt = o.previous().createdAt;
//         o.updatedAt = new Date();
//     });
//     x.beforeCreate(async (o) => {
//         o.uuid = uuid.v4();
//         // o.deletedAt = undefined;
//     });
//     return x;
// }