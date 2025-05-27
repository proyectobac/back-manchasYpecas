const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../database/config');



const Empleado = sequelize.define('empleados', {
  id_empleado: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      is: /^[A-Za-z0-9 ]+$/,
    },
  },
  apellido: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      is: /^[A-Za-z ]+$/,
    },
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      args: true,
      msg: 'Este correo ya ha sido registrado en otro empleado.', // Mensaje cuando el correo es duplicado
    },
    validate: {
      isEmail: {
        args: true,
        msg: 'El correo proporcionado no es válido.', // Mensaje si el correo no tiene formato válido
      },
    },
  },

  documento: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: {
      args: true,
      msg: 'Este documento ya ha sido registrado en otro empleado.'
    },
    validate: {
      is: /^\d{6,10}$/,
    },
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      args: true,
      msg: 'Este teléfono ya ha sido registrado en otro empleado.' // Mensaje correcto para teléfono duplicado
    },
    validate: {
      is: {
        args: /^\d{10}$/, // Expresión regular para verificar que tenga exactamente 10 dígitos
        msg: 'El teléfono debe contener exactamente 10 dígitos.' // Mensaje para formato inválido
      }
    }
  },


  foto: {
    type: DataTypes.STRING,
    allowNull: true,
  },


  estado: {
    type: DataTypes.ENUM('Activo', 'Inactivo'),
    defaultValue: 'Activo',
  },

  createdAt: {
    type: DataTypes.DATE, // Almacenado en UTC
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE, // Almacenado en UTC
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },

  
});




Empleado.prototype.toggleEstado = async function () {
  this.estado = this.estado === 'Activo' ? 'Inactivo' : 'Activo';
  await this.save();
};

// Añadir la asociación con Usuario
Empleado.associate = (models) => {
  Empleado.hasOne(models.Usuario, {
    foreignKey: 'id_empleado',
    as: 'usuarios'
  });
};

module.exports = Empleado;
