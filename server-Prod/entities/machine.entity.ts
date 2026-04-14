import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";

export interface MachineAttributes {
  machineId: string;
  balance: number;
  lastHash: string;
  lastBlockIndex: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MachineModel extends Model<MachineAttributes>, MachineAttributes {}

export type MachineStatic = typeof Model & {
  new(values?: object, options?: BuildOptions): MachineModel;
};

export const MachineFactory = (sequelize: Sequelize): MachineStatic => {
  const attributes: ModelAttributes<MachineModel> = {
    machineId: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      allowNull: false,
    },
    lastHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: '0000000000000000000000000000000000000000000000000000000000000000',
    },
    lastBlockIndex: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  };

  const Machine = sequelize.define('Machine', attributes, {
    tableName: 'machines',
    freezeTableName: true,
    timestamps: true,
  });

  return Machine as any;
};