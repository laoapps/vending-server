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
        allowNull: false,
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

    await queryInterface.createTable('Schedules', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      deviceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Devices', key: 'id' },
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      cron: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      command: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      conditionType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      conditionValue: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.createTable('UserDevices', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userUuid: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      deviceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Devices', key: 'id' },
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
        allowNull: false,
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
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Admins');
    await queryInterface.dropTable('UserDevices');
    await queryInterface.dropTable('Schedules');
    await queryInterface.dropTable('Devices');
    await queryInterface.dropTable('DeviceGroups');
    await queryInterface.dropTable('Owners');
    await queryInterface.dropTable('SchedulePackages');
  },
};