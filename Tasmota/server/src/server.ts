import app from './app';
import { sequelize } from './models';
import { Umzug, SequelizeStorage } from 'umzug';
import path from 'path';
import { Order } from './models/order';
import cron from 'node-cron';
import { Op } from 'sequelize';
const PORT = process.env.PORT || 3000;

// Initialize migrations with Umzug
const umzug = new Umzug({
  migrations: {
    glob: 'migrations/*.js',
    resolve: ({ name, path: migrationPath }) => {
      const migration = require(migrationPath!);
      return {
        name,
        up: async () => migration.up(sequelize.getQueryInterface(), sequelize.Sequelize),
        down: async () => migration.down(sequelize.getQueryInterface(), sequelize.Sequelize),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

// Run migrations and start server
async function startServer() {
  try {
    // every 10 minutes
    setTimeout(() => {
      console.log(' start running cron job');
      
       cron.schedule('*/10 * * * *', async () => {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 60 * 60 * 1000);

        // Delete all unpaid orders older than or equal to 1 hour in a single query
        const deletedCount = await Order.destroy({
          where: {
            paidTime: '',
            createdAt: { [Op.lte]: twentyFourHoursAgo },
          },
        });

        if (deletedCount > 0) {
          console.log(`Deleted ${deletedCount} unpaid order(s)`);
        } else {
          console.log('No unpaid orders to delete');
        }
      } catch (error) {
        console.error('Error in cron job:', error);
      }
    });
    }, 60000);
   
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Run migrations
    await umzug.up();
    console.log('Database migrations applied successfully.');

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();