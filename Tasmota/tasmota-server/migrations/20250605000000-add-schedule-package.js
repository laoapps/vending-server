module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('SchedulePackages', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Owners', key: 'id' },
      },
      durationMinutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      powerConsumptionWatts: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('SchedulePackages');
  },
};