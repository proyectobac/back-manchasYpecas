const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../database/config');
const Pago = require('./pagosmodel');

const PagoEfectivo = sequelize.define('pagos_efectivo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_pago: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Pago,
            key: 'id_pago'
        }
    },
    codigo_pago: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    fecha_vencimiento: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_pago: {
        type: DataTypes.DATE,
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('PENDIENTE', 'PAGADO', 'VENCIDO', 'ANULADO'),
        defaultValue: 'PENDIENTE'
    }
}, {
    timestamps: true,
    tableName: 'pagos_efectivo'
});

// Establecer la relación con el modelo Pago
PagoEfectivo.belongsTo(Pago, { foreignKey: 'id_pago' });
Pago.hasOne(PagoEfectivo, { foreignKey: 'id_pago' });

module.exports = PagoEfectivo; 