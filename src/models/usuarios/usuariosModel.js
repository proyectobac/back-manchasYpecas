const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../database/config');
const bcrypt = require('bcrypt');
const Rol = require('../rol/rolesModel');
const Permiso = require('../permisos/permisosModels');

const Usuario = sequelize.define('usuarios', {
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_empleado: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  id_rol: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  documento: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  nombre_usuario: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      is: /^[a-zA-Z0-9_-]*$/,
    },
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  correo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        args: true,
        msg: 'Por favor, ingrese un correo electrónico válido',
      },
    },
  },
  contrasena: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [7, 255],
        msg: 'La contraseña debe tener al menos 7 caracteres',
      },
    },
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  oneSignalUserId: { // Cambiado de fcmToken
    type: DataTypes.STRING,
    allowNull: true, // Puede ser nulo si el usuario no da permiso
},
  foto: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
  estado: {
    type: DataTypes.ENUM('Activo', 'Inactivo'),
    defaultValue: 'Activo',
  },
  zona_horaria: { // Nuevo campo
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'UTC',
  },
}, {
  timestamps: false,
});

Usuario.belongsTo(Rol, { foreignKey: 'id_rol' });
Usuario.belongsToMany(Permiso, { through: 'UsuarioPermiso' });

// Añadir la asociación con Empleado
Usuario.associate = (models) => {
  Usuario.belongsTo(models.Empleado, {
    foreignKey: 'id_empleado',
    as: 'empleado'
  });
};

Usuario.beforeCreate(async (usuario) => {
  if (!usuario.contrasena) {
    throw new Error('La contraseña no puede estar vacía');
  }
  const hashedPassword = await bcrypt.hash(usuario.contrasena, 10);
  usuario.contrasena = hashedPassword;
});

Usuario.prototype.actualizarTokenReset = async function (token, expires) {
  this.reset_token = token;
  this.reset_token_expires = expires;
  await this.save();
};

module.exports = Usuario;