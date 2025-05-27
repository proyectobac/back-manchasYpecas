// migrations/YYYYMMDDHHMMSS-create-detalles-compra-table.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('detalles_compra', {
      id_detalle_compra: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      id_compra: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'compras', // Nombre de la tabla de compras
          key: 'id_compra',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Si se elimina la compra, se eliminan sus detalles
      },
      id_producto: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'productos', // Nombre de la tabla de productos
          key: 'id_producto',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // No permite eliminar producto si está en detalles de compra
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      precio_costo_unitario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      margen_aplicado: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      precio_venta_calculado: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      subtotal_linea: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Opcional: Crear índices compuestos si buscas frecuentemente por compra y producto juntos
    // await queryInterface.addIndex('detalles_compra', ['id_compra']);
    // await queryInterface.addIndex('detalles_compra', ['id_producto']);
    // await queryInterface.addIndex('detalles_compra', ['id_compra', 'id_producto']); // Índice compuesto
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('detalles_compra');
  }
};