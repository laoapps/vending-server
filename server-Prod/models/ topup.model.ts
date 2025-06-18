import { Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class OwnerEntity extends Model<InferAttributes<OwnerEntity>, InferCreationAttributes<OwnerEntity>> {
    declare id: CreationOptional<number>;
    declare name: string;
    declare token: string;
}

export class UserEntity extends Model<InferAttributes<UserEntity>, InferCreationAttributes<UserEntity>> {
    declare id: CreationOptional<number>;
    declare name: string;
    declare token: string;
    declare balance: number;
}
