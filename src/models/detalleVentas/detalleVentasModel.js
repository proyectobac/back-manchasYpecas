// models/detalleVenta/detalleVentaModel.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../database/config'); // Ajusta ruta
const Ventas = require('../ventas/ventasModel'); // Importa el modelo Ventas recién creado
const Productos = require('../productos/productosModel'); // Importa tu modelo Productos existente

const DetalleVenta = sequelize.define('detalle_venta', {
  id_detalle_venta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_venta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Ventas, // Referencia al modelo Ventas
      key: 'id_venta',
    },
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Productos, // Referencia al modelo Productos
      key: 'id_producto',
    },
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
        isInt: { msg: 'La cantidad debe ser un entero.' },
        min: { args: [1], msg: 'La cantidad debe ser al menos 1.' }
    }
  },
  precio_unitario: { // Precio de VENTA al momento de esta venta específica
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
        isDecimal: { msg: 'El precio unitario debe ser decimal.' },
        min: { args: [0], msg: 'El precio unitario no puede ser negativo.' }
    }
  },
  subtotal_linea: { // Calculado: cantidad * precio_unitario
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
        isDecimal: { msg: 'El subtotal debe ser decimal.' },
        min: { args: [0], msg: 'El subtotal no puede ser negativo.' }
    }
  },
  // createdAt y updatedAt se manejan automáticamente
}, {
  tableName: 'detalle_venta',
  timestamps: true,
});

// --- Asociaciones ---
// Un Detalle pertenece a una Venta
DetalleVenta.belongsTo(Ventas, { foreignKey: 'id_venta', as: 'venta' });
// Una Venta tiene muchos Detalles
Ventas.hasMany(DetalleVenta, { foreignKey: 'id_venta', as: 'detalles' });

// Un Detalle pertenece a un Producto
DetalleVenta.belongsTo(Productos, { foreignKey: 'id_producto', as: 'producto' });
// Un Producto puede estar en muchos Detalles de Venta
Productos.hasMany(DetalleVenta, { foreignKey: 'id_producto', as: 'detallesVenta' });

module.exports = DetalleVenta;