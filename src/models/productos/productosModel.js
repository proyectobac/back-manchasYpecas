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
    type: DataTypes.STRING(50), // Especificar longitud puede ser útil
    allowNull: false,
    unique: {
      msg: 'Ya existe un producto con este nombre',
    },
    validate: { // Añadir validaciones básicas si quieres reforzar en el backend
        notNull: { msg: 'El nombre es requerido.' },
        notEmpty: { msg: 'El nombre no puede estar vacío.' },
        len: { // Coincide con la validación del frontend
            args: [3, 50],
            msg: 'El nombre debe tener entre 3 y 50 caracteres.'
        }
    },
    set(value) {
      // Asegurarse que 'value' sea string antes de llamar métodos de string
      if (typeof value === 'string') {
         this.setDataValue('nombre', value.trim()); // Puedes decidir si guardar en minúsculas o no aquí
         // this.setDataValue('nombre', value.trim().toLowerCase()); // Si prefieres guardar en minúsculas
      } else {
         this.setDataValue('nombre', value); // Dejar que falle la validación si no es string
      }
    },
  },
  categoria: { // <-- NUEVO CAMPO
    type: DataTypes.ENUM('SNACKS', 'HIGIENE', 'JUGUETERIA', 'ACCESORIOS'), // Valores del frontend
    allowNull: false, // Es requerido en el formulario
    validate: {
        notNull: { msg: 'La categoría es requerida.' },
        notEmpty: { msg: 'La categoría no puede estar vacía.' },
        isIn: { // Validación extra para asegurar que el valor esté en el ENUM
            args: [['SNACKS', 'HIGIENE', 'JUGUETERIA', 'ACCESORIOS']],
            msg: 'La categoría seleccionada no es válida.'
        }
    }
  },
  descripcion: {
    type: DataTypes.STRING(150), // Aumentar longitud si es necesario
    allowNull: true, // <-- CAMBIADO: Ahora es opcional, permite NULL
    validate: { // Validación opcional si se ingresa algo
        len: {
            args: [0, 100], // Permite vacío o hasta 100 caracteres
            msg: 'La descripción no puede exceder los 100 caracteres.' // Ajusta mensaje si la longitud mínima cambia
        }
    }
  },
  foto: { // Campo para la ruta/URL de la foto
    type: DataTypes.STRING, // Guarda la ruta o URL, no el binario
    allowNull: true,
    defaultValue: null,
  },
  estado: {
    type: DataTypes.ENUM('Activo', 'Inactivo'),
    allowNull: false, // El estado no debería ser nulo
    defaultValue: 'Activo',
  },
  // --- Campos relacionados con Compras/Stock (Llenados en otro módulo) ---
  precioCosto: {
    type: DataTypes.DECIMAL(10, 2), // Usar DECIMAL para dinero es más preciso
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
    validate: { // Asegurar que el stock no sea negativo si se establece
        min: {
            args: [0],
            msg: 'El stock no puede ser negativo.'
        }
    }
  },
  // --- Campo Opcional (No viene del formulario de creación) ---
  tipoCompra: { // Ejemplo: "Compra Directa", "Consignación" - No relevante para este form
    type: DataTypes.STRING,
    allowNull: true, // <-- CAMBIADO: Ya no es obligatorio al crear el producto aquí
    // Se eliminó la validación notNull/notEmpty
  },
}, {
  tableName: 'productos',
  timestamps: true, // Mantiene createdAt y updatedAt
});

module.exports = Productos;