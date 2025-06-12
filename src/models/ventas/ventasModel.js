// models/ventas/ventasModel.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../database/config'); // Ajusta ruta

const Ventas = sequelize.define('ventas', {
  id_venta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fecha_venta: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
    metodo_pago: {
    type: DataTypes.STRING,
    allowNull: true, // Ponlo en true por si tienes ventas antiguas sin este dato
  },

    referencia_pago: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true, // Cada venta debe tener una referencia de pago única
  },
  total_venta: { // Calculado en el backend para seguridad
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
        isDecimal: { msg: 'El total debe ser un número decimal.' },
        min: { args: [0], msg: 'El total de la venta no puede ser negativo.' }
    }
  },
  estado_venta: {
    // Estados: Pendiente (recién creada), Completada (stock descontado), Enviada, Recibido (confirmado), Cancelada
    type: DataTypes.ENUM('Pendiente', 'Completada', 'Enviada', 'Recibido', 'Cancelada'),
    allowNull: false,
    defaultValue: 'Completada', // Asumimos que se completa al crearla con éxito
  },
  // --- Información del Cliente (guardada directamente) ---
  nombre_cliente: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: { msg: 'El nombre del cliente es requerido.' } }
  },
  telefono_cliente: {
    type: DataTypes.STRING(20), // Longitud razonable
    allowNull: false,
    validate: { notEmpty: { msg: 'El teléfono del cliente es requerido.' } }
  },
  direccion_cliente: {
    type: DataTypes.TEXT, // Usar TEXT para direcciones largas
    allowNull: false,
    validate: { notEmpty: { msg: 'La dirección del cliente es requerida.' } }
  },
  ciudad_cliente: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: { msg: 'La ciudad del cliente es requerida.' } }
  },
  notas_cliente: {
    type: DataTypes.TEXT,
    allowNull: true, // Notas son opcionales
  },
  confirmation_image: {
    type: DataTypes.STRING,
    allowNull: true, // La imagen es opcional hasta que se confirme la entrega
  },
  // --- Timestamps ---
  // createdAt y updatedAt se manejan automáticamente
}, {
  tableName: 'ventas',
  timestamps: true,
});

module.exports = Ventas;