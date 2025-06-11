'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pagos_efectivo', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      id_pago: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'pagos',
          key: 'id_pago'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      codigo_pago: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      fecha_vencimiento: {
        type: Sequelize.DATE,
        allowNull: false
      },
      fecha_pago: {
        type: Sequelize.DATE,
        allowNull: true
      },
      estado: {
        type: Sequelize.ENUM('PENDIENTE', 'PAGADO', 'VENCIDO', 'ANULADO'),
        defaultValue: 'PENDIENTE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pagos_efectivo');
  }
}; 