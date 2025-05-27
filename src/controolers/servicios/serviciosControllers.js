const { sequelize } = require('../../../database/config');
const Servicio = require('../../models/servicios/serviciosModel'); // Asegúrate de que tengas el modelo de Sequelize adecuado para "Servicio".
const cloudinary = require('../../cloudinaryConfig');
const { response } = require('express');
const fs = require('fs');
const path = require('path');



const getServicios = async (req, res = response) => {
    const listServicios = await Servicio.findAll();
    res.json({ listServicios });
}

const getServicio = async (req, res = response) => {
    const { id } = req.params;

    try {
        const servicio = await Servicio.findByPk(id, {
            attributes: ['id', 'nombre', 'valor', 'tiempo', 'foto']
        });

        if (!servicio) {
            return res.status(404).json({ error: `No se encontró el servicio con ID ${id}` });
        }

        const servicioConFoto = {
            id: servicio.id,
            nombre: servicio.nombre,
            valor: servicio.valor,
            tiempo: servicio.tiempo,
            foto: servicio.foto || null // Usar la URL directa de Cloudinary
        };

        res.json(servicioConFoto);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el servicio' });
    }
};

const putServicio = async (req, res = response) => {
    const { id } = req.params;
    const body = req.body;

    const servicio = await Servicio.findByPk(id);

    if (servicio) {
        await servicio.update(body);
        res.json({
            msg: `El servicio fue actualizado exitosamente.`
        });
    } else {
        res.status(404).json({ error: `No se encontró el servicio con ID ${id}` });
    }
}


const postServicio = async (req, res = response) => {
    const { nombre, valor, tiempo, estado } = req.body;
  
    try {
      let fotoUrl = null;
  
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'service_images', // Carpeta en Cloudinary para servicios
          use_filename: true,
          unique_filename: false,
        });
        fotoUrl = result.secure_url;
        fs.unlinkSync(req.file.path); // Eliminar archivo temporal
      }
  
      if (!nombre) {
        return res.status(400).json({ msg: 'El campo nombre es requerido' });
      }
  
      const servicioExistente = await Servicio.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('nombre')),
          nombre.toLowerCase()
        ),
      });
  
      if (servicioExistente) {
        return res.status(400).json({
          msg: 'El nombre del servicio ya está en uso. Por favor, usa un nombre diferente.',
        });
      }
  
      const nuevoServicio = await Servicio.create({
        nombre,
        valor,
        tiempo,
        estado,
        foto: fotoUrl, // Guardamos la URL de Cloudinary
      });
  
      res.json(nuevoServicio);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: 'Error al crear el servicio' });
    }
  };




const deleteServicio = async (req, res = response) => {
    const { id } = req.params;
    const servicio = await Servicio.findByPk(id);

    if (servicio) {
        await servicio.destroy();
        res.json(`El servicio fue eliminado exitosamente.`);
    } else {
        res.status(404).json({ error: `No se encontró el servicio con ID ${id}` });
    }
}

module.exports = {
    getServicio,
    getServicios,
    postServicio,
    putServicio,
    deleteServicio
}
