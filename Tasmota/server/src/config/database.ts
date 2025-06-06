import { Sequelize } from 'sequelize';
import { env } from './env';

const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  query:{
    raw:true
  }
});

export default sequelize;