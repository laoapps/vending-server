module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UnregisteredDevices', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tasmotaId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      connectionAttempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      lastConnections: {
        type: Sequelize.ARRAY(Sequelize.DATE),
        allowNull: false,
        defaultValue: [],
      },
      isBanned: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('UnregisteredDevices');
  },
};