// migrations/YYYYMMDDHHMMSS-create-compras-table.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('compras', {
      id_compra: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      id_proveedor: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'proveedores', // Nombre de la tabla de proveedores
          key: 'id_proveedor',
        },
        onUpdate: 'CASCADE', // Si el id_proveedor cambia, actualiza aquí
        onDelete: 'RESTRICT', // No permite eliminar proveedor si tiene compras asociadas
      },
      numero_referencia: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true, // Asegura unicidad del número de referencia si se proporciona
      },
      fecha_compra: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // Fecha actual por defecto
      },
      total_compra: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      monto_pagado: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false, // Asegura que siempre tenga un valor
        defaultValue: 0.00, // Comienza en 0
      },
      estado_compra: { // <-- CAMBIO EN ENUM y DEFAULT
        type: Sequelize.ENUM('Pendiente de Pago', 'Pagada', 'Pagado Parcial', 'Cancelada'), // Nuevos estados
        allowNull: false,
        defaultValue: 'Pendiente de Pago', // Nuevo default (o 'Pagada' si prefieres)
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

    // Opcional: Crear un índice en id_proveedor si harás muchas búsquedas por proveedor
    // await queryInterface.addIndex('compras', ['id_proveedor']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('compras');
  }
};