module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Modify SchedulePackages table
    await queryInterface.changeColumn('SchedulePackages', 'price', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('SchedulePackages', 'conditionType', {
      type: Sequelize.ENUM('time_duration', 'energy_consumption'),
      allowNull: false,
      defaultValue: 'time_duration',
    });
    await queryInterface.addColumn('SchedulePackages', 'conditionValue', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    });

    // Add packageId to Schedules
    await queryInterface.addColumn('Schedules', 'packageId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'SchedulePackages', key: 'id' },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('SchedulePackages', 'conditionType');
    await queryInterface.removeColumn('SchedulePackages', 'conditionValue');
    await queryInterface.removeColumn('Schedules', 'packageId');
    await queryInterface.changeColumn('SchedulePackages', 'price', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.dropEnum('enum_SchedulePackages_conditionType');
  },
};