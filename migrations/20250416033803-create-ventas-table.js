// migrations/YYYYMMDDHHMMSS-create-ventas-table.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ventas', {
      id_venta: {
        allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER
      },
      fecha_venta: {
        allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      total_venta: {
        allowNull: false, type: Sequelize.DECIMAL(12, 2)
      },
      estado_venta: {
        allowNull: false, type: Sequelize.ENUM('Pendiente', 'Completada', 'Enviada', 'Cancelada'), defaultValue: 'Completada'
      },
      nombre_cliente: {
        allowNull: false, type: Sequelize.STRING
      },
      telefono_cliente: {
        allowNull: false, type: Sequelize.STRING(20)
      },
      direccion_cliente: {
        allowNull: false, type: Sequelize.TEXT
      },
      ciudad_cliente: {
        allowNull: false, type: Sequelize.STRING
      },
      notas_cliente: {
        allowNull: true, type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ventas');
  }
};