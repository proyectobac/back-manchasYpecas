// migrations/YYYYMMDDHHMMSS-create-ventas-table.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ventas', {
      id_venta: {
        allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER
      },
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id_usuario'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      fecha_venta: {
        allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      total_venta: {
        allowNull: false, type: Sequelize.DECIMAL(12, 2)
      },
      estado_venta: {
        allowNull: false, type: Sequelize.ENUM('Pendiente', 'Completada', 'Enviada', 'Recibido', 'Cancelada'), defaultValue: 'Completada'
      },
        referencia_pago: {
        allowNull: true, type: Sequelize.STRING
      },
        metodo_pago: {
        allowNull: true, type: Sequelize.STRING
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
      confirmation_image: {
        allowNull: true, type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Agregar índice para mejorar el rendimiento
    await queryInterface.addIndex('ventas', ['id_usuario'], {
      name: 'idx_ventas_id_usuario'
    });
  },
  async down(queryInterface, Sequelize) {
    // Eliminar índice primero
    await queryInterface.removeIndex('ventas', 'idx_ventas_id_usuario');
    // Luego eliminar la tabla
    await queryInterface.dropTable('ventas');
  }
};