// models/pagos/pagosModel.js (NUEVO ARCHIVO)
const { DataTypes, Sequelize } = require('sequelize');
const { sequelize } = require('../../../database/config'); // Ajusta la ruta
const Venta = require('../ventas/ventasModel'); // Asumiendo que tienes un modelo Ventas
const Usuario = require('../usuarios/usuariosModel'); // Para asociar con el usuario

const Pago = sequelize.define('pagos', {
    id_pago: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_venta: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Venta,
            key: 'id_venta',
        }
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Usuario,
            key: 'id_usuario',
        }
    },
    referencia_pago_interna: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    referencia_agregador: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    metodo_pago: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['PSE', 'TARJETA', 'EFECTIVO']]
        }
    },
    banco_pse: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    monto: {
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    moneda: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'COP',
        validate: {
            isIn: [['COP']] // Por ahora solo pesos colombianos
        }
    },
    estado: {
        type: DataTypes.ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'ERROR', 'ANULADO'),
        allowNull: false,
        defaultValue: 'PENDIENTE',
    },
    datos_cliente: {
        type: DataTypes.JSON,
        allowNull: true,
        // Guarda información como nombre, email, teléfono, documento, etc.
    },
    items: {
        type: DataTypes.JSON,
        allowNull: true,
        // Guarda los items del carrito al momento del pago
    },
    url_redireccion_banco: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    datos_respuesta_agregador: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
    },
    fecha_actualizacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
    }
}, {
    tableName: 'pagos',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
});

// Asociaciones
Pago.belongsTo(Venta, { foreignKey: 'id_venta', as: 'venta' });
Venta.hasOne(Pago, { foreignKey: 'id_venta', as: 'pago' });

Pago.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Usuario.hasMany(Pago, { foreignKey: 'id_usuario', as: 'pagos' });

module.exports = Pago;