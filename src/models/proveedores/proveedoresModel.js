const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../database/config');

const Proveedores = sequelize.define('proveedores', {
  id_proveedor: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tipo_documento: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  num_documento: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'num_documento',
      msg: 'El número de documento ya está en uso',
    },
    validate: {
      isNumeric: {
        msg: 'El número de documento debe ser numérico',
      },
    },
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'nombre',
      msg: 'El nombre ya está en uso',
    },
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isNumeric: {
        msg: 'El teléfono debe contener solo números',
      },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'email',
      msg: 'El email ya está en uso o no es válido',
    },
    validate: {
      isEmail: {
        msg: 'El email debe tener un formato válido',
      },
    },
  },
  estado: {
    type: DataTypes.STRING,
    defaultValue: 'Activo',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false, // Desactiva updatedAt si no es necesario
});


module.exports = Proveedores;

