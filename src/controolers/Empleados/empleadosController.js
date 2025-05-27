const Empleado = require('../../models/empleados/empleadosModel');
const Usuario = require('../../models/usuarios/usuariosModel'); // Importa el modelo de usuarios
const cloudinary = require('../../../cloudinaryConfig');
const path = require('path');
const { response } = require('express');
const fs = require('fs');




const getEmpleados = async (req, res = response) => {
    try {
        // Incluir el modelo Usuario con su alias
        const empleados = await Empleado.findAll({
            
            include: {
                model: Usuario,
                as: 'usuarios', // Asegúrate de que sea el alias correcto
                attributes: ['id_usuario'] // Solo traer el campo id_usuario
            }
        });
        console.log(empleados);


        res.json(empleados);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los empleados' });
    }
};





const getEmpleadosActivos = async (req, res = response) => {
    try {
        const empleados = await Empleado.findAll({
            where: { estado: 'Activo' },
        
        });

        res.json({ empleados });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los empleados activos y sus agendas' });
    }
};



const getEmpleado = async (req, res = response) => {
    const id_empleado = req.params.id;
  
    try {
      const empleado = await Empleado.findByPk(id_empleado, {
        include: {
          model: Usuario,
          as: 'usuarios',
          attributes: ['id_usuario', 'foto'],
        },
      });
  
      if (empleado) {
        const usuario = empleado.usuarios; // Cambio de 'Usuario' a 'usuarios' por el alias
        const fotoUsuario = usuario?.foto;
  
        const empleadoConFotoUrl = {
          ...empleado.toJSON(),
          foto: fotoUsuario || null, // URL directa de Cloudinary
        };
  
        res.json(empleadoConFotoUrl);
      } else {
        res.status(404).json({ error: `Empleado no encontrado con id: ${id_empleado}` });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener el empleado' });
    }
  };







  const postEmpleado = async (req, res = response) => {
    const { nombre, apellido, correo, documento, telefono } = req.body;
  
    try {
      let fotoUrl = null;
  
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'profile_images',
          use_filename: true,
          unique_filename: false,
        });
        fotoUrl = result.secure_url;
        fs.unlinkSync(req.file.path); // Eliminar archivo temporal
      }
  
      const usuarioExistente = await Usuario.findOne({ where: { nombre_usuario: nombre } });
      if (usuarioExistente) {
        return res.status(400).json({ mensaje: 'El nombre de usuario ya existe' });
      }
  
      const empleado = await Empleado.create({
        nombre,
        apellido,
        correo,
        documento,
        telefono,
        foto: fotoUrl,
      });
  
      const usuario = await Usuario.create({
        id_rol: 2,
        nombre_usuario: nombre,
        apellido,
        contrasena: '123456AA',
        correo,
        telefono,
        estado: 'Activo',
        id_empleado: empleado.id_empleado,
        foto: fotoUrl,
      });
  
      res.status(201).json({
        message: 'Empleado agregado exitosamente',
        empleado,
        usuario,
      });
    } catch (error) {
      console.error('Error al agregar el empleado:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
  };







const getValidarDocumento = async (req, res = response) => {
    const { documento } = req.query;
    try {
        const empleado = await Empleado.findOne({ where: { documento } });
        if (empleado) {
            return res.status(400).json({ documento: 'El documento ya existe' });
        }
        return res.status(200).json({ documento: 'Documento válido' });
    } catch (error) {
        console.error('Error al validar el documento:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};



const putEmpleado = async (req, res = response) => {
    const id_empleado = req.params.id;
    const updatedData = req.body;

    try {
        const empleado = await Empleado.findByPk(id_empleado);

        if (!empleado) {
            return res.status(404).json({ error: `No se encontró el empleado con ID: ${id_empleado}` });
        }

        // Actualizar el empleado
        await empleado.update(updatedData);

        // Buscar el usuario asociado al empleado
        const usuario = await Usuario.findOne({ where: { id_empleado: empleado.id_empleado } });

        if (usuario) {
            // Actualizar el usuario con los mismos datos del empleado
            await usuario.update({
                nombre_usuario: updatedData.nombre || empleado.nombre,
                apellido: updatedData.apellido || empleado.apellido,
                correo: updatedData.correo || empleado.correo,
                telefono: updatedData.telefono || empleado.telefono,
                foto: updatedData.foto || empleado.foto,
            });
        }

        res.json({
            msg: `Empleado y usuario asociado actualizados exitosamente.`,
            empleado: empleado,
            usuario: usuario,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el empleado y el usuario asociado' });
    }
};


const deleteEmpleado = async (req, res = response) => {
    const { id } = req.params;

    try {
        const empleado = await Empleado.findByPk(id);

        if (empleado) {
            await empleado.destroy();
            res.json('El empleado fue eliminado exitosamente');
        } else {
            res.status(404).json({ error: `No se encontró el empleado con ID ${id}` });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el empleado' });
    }
};

const cambiarEstadoEmpleado = async (req, res = response) => {
    const id_empleado = req.params.id;

    try {
        const empleado = await Empleado.findByPk(id_empleado);

        if (empleado) {
            empleado.toggleEstado();
            res.json({
                msg: `Estado del empleado actualizado exitosamente. Nuevo estado: ${empleado.estado}`,
                empleado: empleado
            });
        } else {
            res.status(404).json({ error: `No se encontró el empleado con el ID: ${id_empleado}` });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el estado del empleado' });
    }


};

module.exports = {
    getEmpleado,
    deleteEmpleado,
    getEmpleados,
    getEmpleadosActivos,
    postEmpleado,
    putEmpleado,
    cambiarEstadoEmpleado,
    getValidarDocumento,


};