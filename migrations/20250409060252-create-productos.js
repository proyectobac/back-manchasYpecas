'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('productos', {
      // --- Identificador ---
      id_producto: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false, // Las claves primarias no deben ser nulas
      },
      // --- Datos del Formulario ---
      nombre: {
        type: Sequelize.STRING(50), // Longitud especificada
        allowNull: false,
        unique: true, // Mantiene la unicidad
      },
      categoria: { // <-- NUEVO CAMPO
        type: Sequelize.ENUM('SNACKS', 'HIGIENE', 'JUGUETERIA', 'ACCESORIOS'),
        allowNull: false, // Requerido
      },
      descripcion: {
        type: Sequelize.STRING(150), // Longitud ajustada
        allowNull: true, // <-- CAMBIADO: Permite nulos (opcional)
      },
      foto: {
        type: Sequelize.STRING, // Almacena ruta o URL
        allowNull: true,
        defaultValue: null,
      },
      estado: {
        type: Sequelize.ENUM('Activo', 'Inactivo'),
        allowNull: false, // No debe ser nulo
        defaultValue: 'Activo',
      },
      // --- Campos de Compras/Stock ---
      precioCosto: {
        type: Sequelize.DECIMAL(10, 2), // <-- CAMBIADO: Tipo DECIMAL para precisión
        allowNull: true,
        defaultValue: 0.00, // Valor por defecto decimal
      },
      precioVenta: {
        type: Sequelize.DECIMAL(10, 2), // <-- CAMBIADO: Tipo DECIMAL
        allowNull: true,
        defaultValue: 0.00,
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        // Opcional: Podrías añadir una restricción CHECK si tu DB lo soporta fácil
        // constraints: { check: Sequelize.literal('stock >= 0') }
      },
      // --- Campo Opcional ---
      tipoCompra: {
        type: Sequelize.STRING,
        allowNull: true, // <-- CAMBIADO: Ya no es obligatorio
      },
      // --- Timestamps (Manejados por Sequelize/DB) ---
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // O Sequelize.fn('NOW') dependiendo del dialecto
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // O Sequelize.fn('NOW')
      },
    });

    // Opcional: Crear un índice en 'categoria' si vas a filtrar mucho por ella
    // await queryInterface.addIndex('productos', ['categoria']);
  },

  async down(queryInterface, Sequelize) {
    // Simplemente elimina la tabla completa
    await queryInterface.dropTable('productos');
  }
};