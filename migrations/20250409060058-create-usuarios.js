'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios', {
      id_usuario: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      id_rol: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'Roles',
          key: 'id_rol',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
      id_cliente: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      id_empleado: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      documento: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      nombre_usuario: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      apellido: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      telefono: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      correo: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      contrasena: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      codigo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      oneSignalUserId: { // Cambiado de fcmToken
        type: Sequelize.STRING,
        allowNull: true, // Puede ser nulo si el usuario no da permiso
      },
      foto: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM('Activo', 'Inactivo'),
        defaultValue: 'Activo',
      },
      zona_horaria: { // Nuevo campo
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'UTC',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false,
        onUpdate: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('usuarios');
  },
};