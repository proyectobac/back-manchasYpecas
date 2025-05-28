const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../database/config');
const Usuario = require('../usuarios/usuariosModel');

const Clientes = sequelize.define('clientes', {
  id_cliente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  documento: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id_usuario',
    },
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
});

// Establecer la relación con Usuario
Clientes.belongsTo(Usuario, { foreignKey: 'id_usuario' });
Usuario.hasOne(Clientes, { foreignKey: 'id_usuario' });

module.exports = Clientes; 