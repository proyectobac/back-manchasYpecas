// En src/models/productos/productosModel.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../database/config'); // Asegúrate que la ruta sea correcta

const Productos = sequelize.define('productos', {
  // --- Identificador ---
  id_producto: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // --- Datos del Formulario de Creación ---
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: {
      msg: 'Ya existe un producto con este nombre',
    },
    validate: {
        notNull: { msg: 'El nombre es requerido.' },
        notEmpty: { msg: 'El nombre no puede estar vacío.' },
        len: {
            args: [3, 50],
            msg: 'El nombre debe tener entre 3 y 50 caracteres.'
        }
    },
    set(value) {
      if (typeof value === 'string') {
         this.setDataValue('nombre', value.trim());
      } else {
         this.setDataValue('nombre', value);
      }
    },
  },
  categoria: {
    //  *****************************************************************
    //  *************** ¡AQUÍ ESTÁ LA CORRECCIÓN! ***********************
    //  *****************************************************************
    type: DataTypes.ENUM('SNACKS', 'HIGIENE', 'JUGUETERIA', 'ACCESORIOS', 'COMEDEROS'), // <-- AÑADIDO 'COMEDEROS'
    allowNull: false,
    validate: {
        notNull: { msg: 'La categoría es requerida.' },
        notEmpty: { msg: 'La categoría no puede estar vacía.' },
        isIn: {
            args: [['SNACKS', 'HIGIENE', 'JUGUETERIA', 'ACCESORIOS', 'COMEDEROS']], // <-- AÑADIDO 'COMEDEROS'
            msg: 'La categoría seleccionada no es válida.'
        }
    }
  },
  descripcion: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: {
        len: {
            args: [0, 100],
            msg: 'La descripción no puede exceder los 100 caracteres.'
        }
    }
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  estado: {
    type: DataTypes.ENUM('Activo', 'Inactivo'),
    allowNull: false,
    defaultValue: 'Activo',
  },
  // --- Campos relacionados con Compras/Stock ---
  precioCosto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  precioVenta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
        min: {
            args: [0],
            msg: 'El stock no puede ser negativo.'
        }
    }
  },
  // --- Campo Opcional ---
  tipoCompra: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'productos',
  timestamps: true,
});

module.exports = Productos;