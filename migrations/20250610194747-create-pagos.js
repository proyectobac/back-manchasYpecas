'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pagos', {
      id_pago: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_venta: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'ventas',
          key: 'id_venta',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id_usuario',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      referencia_pago_interna: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      referencia_agregador: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      metodo_pago: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      banco_pse: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      monto: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      moneda: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'COP',
      },
      estado: {
        type: Sequelize.ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'ERROR', 'ANULADO'),
        allowNull: false,
        defaultValue: 'PENDIENTE',
      },
      datos_cliente: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      items: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      url_redireccion_banco: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      datos_respuesta_agregador: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      fecha_creacion: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      fecha_actualizacion: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('pagos');
  }
};