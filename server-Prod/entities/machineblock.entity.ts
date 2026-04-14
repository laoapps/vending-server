import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from "sequelize";

export interface MachineBlockAttributes {
  id: number;
  machineId: string;
  blockIndex: number;
  prevHash: string;
  hash: string;
  data: any;                    // JSONB
  timestamp: Date;
  signature?: string;
  isReset: boolean;
  laabXWallet?: string;
  transferredAmount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MachineBlockModel extends Model<MachineBlockAttributes>, MachineBlockAttributes {}

export type MachineBlockStatic = typeof Model & {
  new(values?: object, options?: BuildOptions): MachineBlockModel;
};

export const MachineBlockFactory = (sequelize: Sequelize): MachineBlockStatic => {
  const attributes: ModelAttributes<MachineBlockModel> = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    machineId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    blockIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    prevHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    signature: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isReset: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    laabXWallet: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    transferredAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
  };

  const MachineBlock = sequelize.define('MachineBlock', attributes, {
    tableName: 'machine_blocks',
    freezeTableName: true,
    timestamps: true,           // adds createdAt + updatedAt
  });

  // Prevent accidental updates (blockchain should be immutable)
  MachineBlock.beforeUpdate(async () => {
    throw new Error('MachineBlock is immutable - updates are not allowed');
  });

  return MachineBlock as any;
};