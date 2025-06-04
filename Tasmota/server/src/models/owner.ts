
import { Sequelize, DataTypes, Model } from 'sequelize';

export class Owner extends Model {
  public id!: number;
  public uuid!: string;
  public phoneNumber!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initOwnerModel(sequelize: Sequelize) {
  Owner.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Owner',
      tableName: 'Owners',
    }
  );
  return Owner;
}