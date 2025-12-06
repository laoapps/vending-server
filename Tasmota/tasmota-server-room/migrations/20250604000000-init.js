module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Owners', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      phoneNumber: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
    await queryInterface.createTable('DeviceGroups', {
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
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
    await queryInterface.createTable('Devices', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      tasmotaId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      zone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Owners', key: 'id' },
      },
      status: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      power: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      energy: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      groupId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'DeviceGroups', key: 'id' },
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.createTable('Admins', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      phoneNumber: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

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
    await queryInterface.dropTable('Admins');
    await queryInterface.dropTable('UserDevices');
    await queryInterface.dropTable('Schedules');
    await queryInterface.dropTable('DeviceGroups');
    await queryInterface.dropTable('Devices');
    await queryInterface.dropTable('Owners');
    await queryInterface.dropTable('SchedulePackages');
    await queryInterface.dropTable('UnregisteredDevices');
  },
};