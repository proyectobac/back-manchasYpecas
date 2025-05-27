const jwt = require('jsonwebtoken');
const { sequelize } = require('../../../database/config');
const Usuario = require('../../models/usuarios/usuariosModel');
const Rol = require('../../models/rol/rolesModel');
const Permiso = require('../../models/permisos/permisosModels');
const { response } = require('express');
const bcrypt = require('bcrypt');

async function iniciarSesion(req, res = response) {
  const { nombre_usuario, contrasena } = req.body;

  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');

    const usuarioEncontrado = await Usuario.findOne({
      where: { nombre_usuario },
      include: {
        model: Rol,
        include: {
          model: Permiso,
          as: 'permisos',
        },
      },
    });

    if (!usuarioEncontrado) {
      return res.status(401).json({ mensaje: 'Usuario no encontrado' });
    }

    if (bcrypt.compareSync(contrasena, usuarioEncontrado.contrasena)) {
      if (usuarioEncontrado.estado === 'Inactivo') {
        return res.status(403).json({ mensaje: 'Usuario inactivo, no puede iniciar sesión' });
      }

      if (usuarioEncontrado.Rol.estado === 'Inactivo') {
        return res.status(403).json({ mensaje: 'Rol inactivo, no se puede iniciar sesión' });
      }

  

      let mensaje;
      if (usuarioEncontrado.Rol.nombre === 'Admin') {
        mensaje = 'No puedes inactivar tu Cuenta de Super Admin';
      } else if (usuarioEncontrado.Rol.nombre === 'Empleado') {
        mensaje = 'Cuenta de Empleado';
      }

      const usuarioFormateado = {
        userId: usuarioEncontrado.id_usuario,
        nombre_usuario: usuarioEncontrado.nombre_usuario,
        rol: {
          id_rol: usuarioEncontrado.Rol.id_rol,
          nombre: usuarioEncontrado.Rol.nombre,
          estado: usuarioEncontrado.Rol.estado,
          permisos: usuarioEncontrado.Rol.permisos.map(permiso => ({
            id_permiso: permiso.id_permiso,
            nombre_permiso: permiso.nombre_permiso,
            ruta: permiso.ruta,
          })),
        },
        correo: usuarioEncontrado.correo,
     
        estado: usuarioEncontrado.estado,
        foto: usuarioEncontrado.foto,
        zona_horaria: usuarioEncontrado.zona_horaria,
      };

      const token = generarToken(usuarioFormateado);

      res.json({
        token,
        usuario: usuarioFormateado,
        mensaje,
      });
    } else {
      res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }
  } catch (error) {
    console.error('Error al buscar el usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

function generarToken(usuario, tipoToken) {
  const { userId, nombre_usuario, rol } = usuario;

  const secretKey = process.env.JWT_SECRET || 'secreto-seguro';
  const duracionTokenReset = '1d';

  if (tipoToken === 'reset') {
    return jwt.sign({ userId, tipo: 'reset' }, secretKey, { expiresIn: duracionTokenReset });
  }

  return jwt.sign({ nombre_usuario, userId, rol }, secretKey, { expiresIn: '24h' });
}

module.exports = {
  iniciarSesion,
  generarToken,
};