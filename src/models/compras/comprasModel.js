// models/compras.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../database/config'); // Ajusta la ruta a tu config de DB
const Proveedores = require('../proveedores/proveedoresModel'); // Importa el modelo de Proveedores

const Compras = sequelize.define('compras', {
  id_compra: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_proveedor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Proveedores,
      key: 'id_proveedor',
    },
    validate: {
        notNull: { msg: 'El proveedor es requerido.' },
        isInt: { msg: 'ID de proveedor inválido.' }
    }
  },
  numero_referencia: { // Ejemplo: Número de factura del proveedor o referencia interna
    type: DataTypes.STRING(50),
    allowNull: true, // Puede ser opcional si es interno
    unique: {
        name: 'compras_numero_referencia_unique', // Nombre único para la restricción
        msg: 'El número de referencia ya está en uso para otra compra.'
    },
  },
  fecha_compra: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Fecha actual por defecto
  },
  total_compra: { // Calculado a partir de los detalles
    type: DataTypes.DECIMAL(12, 2), // Precisión adecuada para totales
    allowNull: false,
    defaultValue: 0.00,
    validate: {
        isDecimal: { msg: 'El total debe ser un número decimal.' },
        min: {
            args: [0],
            msg: 'El total de la compra no puede ser negativo.'
        }
    }
  },
   // --- CAMPO AÑADIDO ---
   monto_pagado: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false, // Cambiado a false para asegurar que siempre haya un valor
    defaultValue: 0.00, // Valor inicial al crear la compra
    validate: {
        isDecimal: { msg: 'El monto pagado debe ser un número decimal.' },
        min: { args: [0], msg: 'El monto pagado no puede ser negativo.' },
        // Validación personalizada opcional para asegurar monto_pagado <= total_compra
        // Esta validación es mejor hacerla en el controlador ANTES de guardar
    }
  },
  estado_compra: { // <-- CAMBIO EN ENUM y DEFAULT
    type: DataTypes.ENUM('Pendiente de Pago', 'Pagada', 'Pagado Parcial', 'Cancelada'), // Nuevos estados
    allowNull: false,
    defaultValue: 'Pendiente de Pago', // Nuevo default (o 'Pagada' si prefieres)
  },
  // createdAt y updatedAt se manejan automáticamente por Sequelize si timestamps: true
}, {
  tableName: 'compras',
  timestamps: true, // Habilita createdAt y updatedAt
});

// --- Asociaciones ---
// Una Compra pertenece a un Proveedor
Compras.belongsTo(Proveedores, { foreignKey: 'id_proveedor', as: 'proveedor' });
// Un Proveedor puede tener muchas Compras
Proveedores.hasMany(Compras, { foreignKey: 'id_proveedor', as: 'compras' });

module.exports = Compras;