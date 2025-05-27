const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../database/config');

const Permiso = sequelize.define('Permiso', {
  id_permiso: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre_permiso: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false,
    validate: {
      notEmpty: true,
    },
  },
  ruta: {
    type: DataTypes.STRING, // Puedes ajustar el tipo de dato según tus necesidades
    allowNull: true, // Puedes ajustar la restricción de nulidad según tus necesidades
  },
}, {
  timestamps: true,
});

module.exports = Permiso;
