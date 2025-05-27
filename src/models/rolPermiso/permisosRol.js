const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../database/config');

const RolPermiso = sequelize.define('RolPermiso', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  id_rol: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  id_permiso: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'RolPermiso', // Especifica el nombre exacto de la tabla
});

module.exports = RolPermiso;