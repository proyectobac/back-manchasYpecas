'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('empleados', {
      id_empleado: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nombre: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      apellido: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      correo: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      documento: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      telefono: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      foto: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM('Activo', 'Inactivo'),
        defaultValue: 'Activo',
      },
      createdAt: {
        type: Sequelize.DATE, // Almacenado en UTC
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        type: Sequelize.DATE, // Almacenado en UTC
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('empleados');
  }
};