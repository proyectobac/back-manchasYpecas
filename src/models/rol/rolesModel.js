const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../database/config');
// Importa los modelos necesarios
const RolPermiso = require('../rolPermiso/permisosRol');
const Permiso = require('../permisos/permisosModels');

const Rol = sequelize.define('Rol', {
  id_rol: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        args: true,
        msg: "El nombre no puede estar vacío.",
      },
      is: {
        args: [/^[a-zA-Z ]+$/],
        msg: "El nombre solo puede contener letras y espacios.",
      },
      len: {
        args: [3, 255],
        msg: "El nombre debe tener entre 3 y 255 caracteres.",
      },
    },
  },
  estado: {
    type: DataTypes.ENUM('Activo', 'Inactivo'),
    defaultValue: 'Activo',
  },
}, {
  tableName: 'Roles', // ¡Agrega esta línea para especificar el nombre de la tabla!

  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Relación muchos a muchos con Permiso a través de RolPermiso
Rol.belongsToMany(Permiso, {
  through: RolPermiso,
  foreignKey: 'id_rol',
  otherKey: 'id_permiso',
  as: 'permisos', // Alias para la relación
});

// Método para asignar permisos a un rol
Rol.prototype.asignarPermisos = async function (permisoIds) {
  try {
    // Elimina todos los permisos asociados con este rol
    await RolPermiso.destroy({
      where: { id_rol: this.id_rol },
    });

    // Asigna los nuevos permisos al rol
    const nuevosPermisos = permisoIds.map((id_permiso) => ({ id_rol: this.id_rol, id_permiso }));
    await RolPermiso.bulkCreate(nuevosPermisos);

    return true; // Indica que la asignación fue exitosa
  } catch (error) {
    console.error(error);
    throw new Error('Error al asignar permisos al rol');
  }
};
module.exports = Rol;