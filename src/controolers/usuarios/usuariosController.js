const Usuario = require('../../models/usuarios/usuariosModel');
const Empleado = require('../../models/empleados/empleadosModel');
const Permiso = require('../../models/permisos/permisosModels');
const Clientes = require('../../models/clientes/clientesModel');
const { response } = require('express');
const Rol = require('../../models/rol/rolesModel');

const { Sequelize } = require('sequelize');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');



const getUsuarios = async (req, res = response) => {
  try {
    const usuarios = await Usuario.findAll({
      include: [
        {
          model: Rol,
          include: {
            model: Permiso,
            as: "permisos",
          },
        },
     
      ],
    });

    res.json({ usuarios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};



const getUsuario = async (req, res = response) => {
  const { id } = req.params;

  try {
    const usuario = await Usuario.findByPk(id);

    if (usuario) {
      const usuarioConImagen = {
        ...usuario.toJSON(),
        foto: usuario.foto || null, // URL directa de Cloudinary
      };
      res.json(usuarioConImagen);
    } else {
      res.status(404).json({ error: `No se encontró el usuario con ID ${id}` });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
};



const postUsuario = async (req, res = response) => {
  const newEntryData = req.body;
  console.log('Datos de la nueva entrada:', newEntryData);

  if (!newEntryData.contrasena) {
    return res.status(400).json({ error: 'La contraseña no se ha proporcionado correctamente' });
  }

  try {
    // Buscar el último cliente para generar el código
    const ultimoCliente = await Clientes.findOne({ order: [['id_cliente', 'DESC']] });
    let nuevoCodigo = 'COD-001';

    if (ultimoCliente && ultimoCliente.codigo) {
      const ultimoNumero = parseInt(ultimoCliente.codigo.split('-')[1], 10);
      nuevoCodigo = `COD-${(ultimoNumero + 1).toString().padStart(3, '0')}`;
    }

    newEntryData.codigo = nuevoCodigo;

    let empleado = null;
    let nuevoCliente = null;
    let createdUsuarioItem = null;

    if (Number(newEntryData.id_rol) === 2) {
      console.log("Creando empleado...");
      try {
        empleado = await Empleado.create({
          nombre: newEntryData.nombre_usuario,
          apellido: newEntryData.apellido || '',
          correo: newEntryData.correo,
          documento: newEntryData.documento || '',
          telefono: newEntryData.telefono || '',
          foto: newEntryData.foto || null,
          estado: 'Activo',
        });
        console.log("Empleado creado:", empleado);
      } catch (error) {
        console.error("Error creando empleado:", error);
        return res.status(500).json({ error: 'Error al crear el empleado' });
      }
    } else {
      console.log("No se creará empleado porque el rol no es 2.");
    }

    try {
      createdUsuarioItem = await Usuario.create({
        ...newEntryData,
        id_empleado: empleado ? empleado.id_empleado : null,
        documento: newEntryData.documento || '',
        foto: newEntryData.foto || null,
      });
    } catch (error) {
      console.error("Error creando usuario:", error);
      return res.status(500).json({ error: 'Error al crear el usuario' });
    }

    if (!empleado) {
      try {
        nuevoCliente = await Clientes.create({
          nombre: newEntryData.nombre || createdUsuarioItem.nombre_usuario,
          apellido: newEntryData.apellido || '',
          documento: newEntryData.documento || '',
          codigo: nuevoCodigo,
          correo: newEntryData.correo || createdUsuarioItem.correo,
          telefono: newEntryData.telefono || '',
          estado: true,
          id_usuario: createdUsuarioItem.id_usuario,
        });
      } catch (error) {
        console.error("Error creando cliente:", error);
        return res.status(500).json({ error: 'Error al crear el cliente' });
      }
    }

    return res.status(201).json({
      message: empleado ? 'Usuario y empleado creados exitosamente' : 'Usuario y cliente creados exitosamente',
      usuario: createdUsuarioItem,
      empleado: empleado || null,
      cliente: nuevoCliente || null,
    });
  } catch (error) {
    console.error(error);

    if (error instanceof Sequelize.ValidationError) {
      return res.status(400).json({
        error: 'Errores de validación: ' + error.errors.map(err => `${err.path}: ${err.message}`).join(', ')
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      let errorMessage = 'Error de restricción única';
      if (error.errors[0].path === 'nombre_usuario') {
        errorMessage = 'P002 - E002. El nombre de usuario ya está en uso. Por favor, elige otro nombre.';
      } else if (error.errors[0].path === 'correo') {
        errorMessage = 'P002 - E002. El correo electrónico ya está en uso. Por favor, ingresa otro correo.';
      }
      return res.status(400).json({ error: errorMessage });
    }

    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};




const putUsuario = async (req, res = response) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      return res.status(404).json({ error: `No se encontró un elemento de Usuario con ID ${id}` });
    }

    // Validar si se está intentando cambiar el nombre de usuario (ignorando mayúsculas/minúsculas)
    if (updatedData.nombre_usuario && updatedData.nombre_usuario.toLowerCase() !== usuario.nombre_usuario.toLowerCase()) {
      const existingUsername = await Usuario.findOne({
        where: { nombre_usuario: updatedData.nombre_usuario },
      });

      if (existingUsername) {
        return res.status(400).json({ error: "El nombre de usuario ya está en uso" });
      }
    }

    // Validar si se está intentando cambiar el correo
    if (updatedData.correo && updatedData.correo !== usuario.correo) {
      const existingEmail = await Usuario.findOne({
        where: { correo: updatedData.correo },
      });

      if (existingEmail) {
        return res.status(400).json({ error: "El correo electrónico ya está en uso" });
      }
    }

    // Actualizar el usuario
    await usuario.update(updatedData);

    // Si el usuario tiene un empleado asociado, actualizar el empleado
    if (usuario.id_empleado) {
      const empleado = await Empleado.findByPk(usuario.id_empleado);
      if (empleado) {
        await empleado.update({
          nombre: updatedData.nombre_usuario || empleado.nombre,
          apellido: updatedData.apellido || empleado.apellido,
          correo: updatedData.correo || empleado.correo,
          documento: updatedData.documento || empleado.documento,
          telefono: updatedData.telefono || empleado.telefono,
          foto: updatedData.foto || empleado.foto,
        });
      }
    }

    // Si el usuario tiene un cliente asociado, actualizar el cliente
    if (usuario.id_cliente) {
      const cliente = await Clientes.findByPk(usuario.id_cliente);
      if (cliente) {
        await cliente.update({
          nombre: updatedData.nombre_usuario || cliente.nombre,
          apellido: updatedData.apellido || cliente.apellido,
          correo: updatedData.correo || cliente.correo,
          documento: updatedData.documento || cliente.documento,
          telefono: updatedData.telefono || cliente.telefono,
        });
      }
    }

    res.json({ msg: `El elemento de Usuario fue actualizado exitosamente.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el elemento de Usuario" });
  }
};


const deleteUsuario = async (req, res = response) => {
  const { id } = req.params;

  try {
    const usuario = await Usuario.findByPk(id);

    if (usuario) {
      await usuario.destroy();
      res.json("Elemento de Usuario eliminado exitosamente");
    } else {
      res
        .status(404)
        .json({ error: ` P002 - E002 No se encontró un elemento de usuario con ID ${id}` });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: " P002 - E002 Error al eliminar el elemento de usuario" });
  }
};

const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, correo, nuevaContrasena } = req.body;

    // Verifica y decodifica el token de autenticación
    const authorizationHeader = req.headers["authorization"];

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({ mensaje: "Token no válido" });
    }

    const token = authorizationHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, "secreto-seguro");

    // Busca al usuario por ID (utilizando el ID del token decodificado)
    const usuario = await Usuario.findOne({
      where: { nombre_usuario: decodedToken.nombre_usuario },
    });

    if (!usuario) {
      return res
        .status(404)
        .json({ mensaje: " P002 - E002 Usuario no encontrado", decodedToken });
    }

    // Actualiza los campos del perfil
    usuario.nombre_usuario = nombre || usuario.nombre_usuario;
    usuario.correo = correo || usuario.correo;

    // Actualiza la contraseña si se proporciona una nueva
    if (nuevaContrasena) {
      const hashedContrasena = await bcrypt.hash(nuevaContrasena, 10);
      usuario.contrasena = hashedContrasena;
    }

    // Guarda los cambios en la base de datos
    await usuario.save();

    res.json({ mensaje: "Perfil actualizado con éxito" });
  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      if (error.fields.nombre_usuario) {
        return res
          .status(400)
          .json({ mensaje: " P002 - E002El nombre de usuario ya está en uso" });
      } else if (error.fields.correo) {
        return res
          .status(400)
          .json({ mensaje: " P002 - E002 El correo electrónico ya está en uso" });
      }
    }
    res.status(500).json({ mensaje: " P002 - E002 Error al actualizar el perfil" });
  }
};

const actualizarEstadoUsuario = async (req, res = response) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    const usuario = await Usuario.findByPk(id);

    if (usuario) {
      usuario.estado = estado;
      await usuario.save();

      res.json({ mensaje: "Estado de usuario actualizado correctamente" });
    } else {
      res.status(404).json({ error: ` P002 - E002 No se encontró un usuario con ID ${id}` });
    }
  } catch (error) {
    console.error(" P002 - E002 Error al actualizar estado de usuario:", error);
    res.status(500).json({ error: "Error al actualizar estado de usuario" });
  }
};

module.exports = {
  getUsuario,
  getUsuarios,
  postUsuario,
  putUsuario,
  deleteUsuario,
  actualizarPerfil,
  actualizarEstadoUsuario,
};
