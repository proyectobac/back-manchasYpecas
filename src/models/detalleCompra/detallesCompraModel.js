// models/detallesCompra.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../database/config'); // Ajusta la ruta
const Compras = require('../compras/comprasModel'); // Importa el modelo de Compras
const Productos = require('../productos/productosModel'); // Importa el modelo de Productos

const DetallesCompra = sequelize.define('detalles_compra', {
  id_detalle_compra: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_compra: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Compras,
      key: 'id_compra',
    },
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Productos,
      key: 'id_producto',
    },
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
        notNull: { msg: 'La cantidad es requerida.' },
        isInt: { msg: 'La cantidad debe ser un número entero.' },
        min: {
            args: [1],
            msg: 'La cantidad debe ser al menos 1.'
        }
    }
  },
  precio_costo_unitario: { // Precio de costo al momento de ESTA compra específica
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
        notNull: { msg: 'El precio de costo unitario es requerido.' },
        isDecimal: { msg: 'El precio de costo debe ser un número decimal.' },
        min: {
            args: [0],
            msg: 'El precio de costo no puede ser negativo.'
        }
    }
  },
  margen_aplicado: { // El % de margen que se USÓ para calcular el precio de venta
    type: DataTypes.DECIMAL(5, 2), // Ej: 8.00 para 8%
    allowNull: true, // Podría ser opcional si no siempre se calcula así
    validate: {
        isDecimal: { msg: 'El margen debe ser un número decimal.' },
        min: {
            args: [0],
            msg: 'El margen no puede ser negativo.'
        }
    }
  },
  precio_venta_calculado: { // Precio de venta calculado para ESTA compra
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true, // Puede ser null si no se calcula aquí
    validate: {
        isDecimal: { msg: 'El precio de venta debe ser un número decimal.' },
         min: {
            args: [0],
            msg: 'El precio de venta no puede ser negativo.'
        }
    }
  },
  subtotal_linea: { // Calculado: cantidad * precio_costo_unitario
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
        isDecimal: { msg: 'El subtotal debe ser un número decimal.' },
         min: {
            args: [0],
            msg: 'El subtotal no puede ser negativo.'
        }
    }
  },
   // createdAt y updatedAt se manejan automáticamente
}, {
  tableName: 'detalles_compra',
  timestamps: true,
});

// --- Asociaciones ---
// Un Detalle pertenece a una Compra
DetallesCompra.belongsTo(Compras, { foreignKey: 'id_compra', as: 'compra' });
// Una Compra puede tener muchos Detalles
Compras.hasMany(DetallesCompra, { foreignKey: 'id_compra', as: 'detalles' });

// Un Detalle pertenece a un Producto
DetallesCompra.belongsTo(Productos, { foreignKey: 'id_producto', as: 'producto' });
// Un Producto puede estar en muchos Detalles de Compra
Productos.hasMany(DetallesCompra, { foreignKey: 'id_producto', as: 'detallesCompra' });


module.exports = DetallesCompra;