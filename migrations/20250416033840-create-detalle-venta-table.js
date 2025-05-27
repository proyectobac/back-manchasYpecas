// migrations/YYYYMMDDHHMMSS-create-detalle-venta-table.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('detalle_venta', {
      id_detalle_venta: {
        allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER
      },
      id_venta: {
        allowNull: false, type: Sequelize.INTEGER,
        references: { model: 'ventas', key: 'id_venta' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE' // Si se borra la venta, se borran sus detalles
      },
      id_producto: {
        allowNull: false, type: Sequelize.INTEGER,
        references: { model: 'productos', key: 'id_producto' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT' // No borrar producto si está en una venta
      },
      cantidad: {
        allowNull: false, type: Sequelize.INTEGER
      },
      precio_unitario: {
        allowNull: false, type: Sequelize.DECIMAL(10, 2)
      },
      subtotal_linea: {
        allowNull: false, type: Sequelize.DECIMAL(12, 2)
      },
      createdAt: {
        allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    // Índices opcionales para mejorar rendimiento de búsquedas
    await queryInterface.addIndex('detalle_venta', ['id_venta']);
    await queryInterface.addIndex('detalle_venta', ['id_producto']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('detalle_venta');
  }
};