import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";
import * as uuid from 'uuid';

/**
 * NEW dedicated entity for "Blockchain Value" (coupon/credit per machine).
 * This is SEPARATE from your existing MachineClientID model.
 * It stores the current value + optional immutable transaction history in `data` JSONB.
 *
 * Recommended table name: machine_blockchain_values (or machine_coupon_values)
 */

export interface IMachineBlockchainValueAttribute {
  id?: number;
  uuid?: string;
  machineId: string;
  ownerUuid: string;
  value: number;
  data?: Record<string, any> | null; // Can store tx history, lastHash, metadata
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MachineBlockchainValueModel extends Model<IMachineBlockchainValueAttribute>, IMachineBlockchainValueAttribute {}

export class MachineBlockchainValue extends Model<MachineBlockchainValueModel, IMachineBlockchainValueAttribute> {}

export type MachineBlockchainValueStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): MachineBlockchainValueModel;
};

export const MachineBlockchainValueFactory = (name: string, sequelize: Sequelize): MachineBlockchainValueStatic => {
  const attributes: ModelAttributes<MachineBlockchainValueModel> = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true,
      autoIncrementIdentity: true,
    },
    uuid: {
      allowNull: false,
      unique: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    machineId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ownerUuid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  } as ModelAttributes<MachineBlockchainValueModel>;

  const ModelClass = sequelize.define(name, attributes, {
    tableName: name,
    freezeTableName: true,
  }) as unknown as MachineBlockchainValueStatic;

  // Protect identity fields (same pattern as your MachineClientID)
  ModelClass.beforeUpdate(async (instance: any) => {
    if (instance.changed('uuid')) {
      instance.uuid = instance.previous().uuid;
    }
    if (instance.changed('id')) {
      instance.id = instance.previous().id;
    }
    instance.createdAt = instance.previous().createdAt;
    instance.updatedAt = new Date();
  });

  ModelClass.beforeCreate(async (instance: any) => {
    if (!instance.uuid) {
      instance.uuid = uuid.v4();
    }
    if (instance.data === undefined || instance.data === null) {
      instance.data = {};
    }
    if (instance.value === undefined || instance.value === null) {
      instance.value = 0;
    }
  });

  return ModelClass;
};
