module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Schedules');
    if (!tableInfo.createdBy) {
      await queryInterface.addColumn('Schedules', 'createdBy', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable('Schedules');
    if (tableInfo.createdBy) {
      await queryInterface.removeColumn('Schedules', 'createdBy');
    }
  },
};