const Permiso = require('../../models/permisos/permisosModels');
const { response } = require('express');
const Rol = require('../../models/rol/rolesModel'); 

const getPermisos = async (req, res = response) => {
    try {
        const listaPermisos = await Permiso.findAll();
        res.json({ listaPermisos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener permisos' });
    }
};

const getPermiso = async (req, res = response) => {
    const { id } = req.params;
    try {
        const permiso = await Permiso.findByPk(id);
        if (permiso) {
            res.json(permiso);
        } else {
            res.status(404).json({ error: `No se encontró el permiso con ID ${id}` });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el permiso' });
    }
};

const postPermiso = async (req, res = response) => {
    try {
        const body = req.body; // Asumiendo que req.body es el objeto que quieres guardar

        // Crear un nuevo permiso utilizando los datos del cuerpo
        const nuevoPermiso = await Permiso.create(body);

        // Devolver el nuevo permiso creado en lugar del cuerpo original
        res.json(nuevoPermiso);
    } catch (error) {
        // Manejar cualquier error que pueda ocurrir durante el proceso
        console.error("Error al crear el permiso:", error);
        res.status(500).json({ error: "Hubo un error al crear el permiso" });
    }
};

const editPermiso = async (req, res = response) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    try {
        const permiso = await Permiso.findByPk(id);

        if (permiso) {
            await permiso.update({ nombre, descripcion });
            res.json({ message: 'Permiso actualizado con éxito' });
        } else {
            res.status(404).json({ error: `No se encontró el permiso con ID ${id}` });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el permiso' });
    }
};

const deletePermiso = async (req, res = response) => {
    const { id } = req.params;

    try {
        const permiso = await Permiso.findByPk(id);

        if (permiso) {
            await permiso.destroy();
            res.json('Permiso eliminado exitosamente');
        } else {
            res.status(404).json({ error: `No se encontró el permiso con ID ${id}` });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el permiso' });
    }
};




module.exports = {
    getPermisos,
    getPermiso,
    postPermiso,
    editPermiso,
    deletePermiso,
 
};

