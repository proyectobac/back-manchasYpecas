const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../database/config');

const Servicios = sequelize.define('servicios', {

  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  valor: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  tiempo: {
    type: DataTypes.INTEGER, // Tiempo en minutos
    allowNull: false,
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  underscored: true, // Usa snake_case en los nombres de columnas
  timestamps: false, // Si no necesitas timestamps
});


module.exports = Servicios;
