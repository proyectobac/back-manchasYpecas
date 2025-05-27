const Rol = require('../../models/rol/rolesModel');
const Permiso = require('../../models/permisos/permisosModels');
const { response } = require('express');


const getRoles = async (req, res = response) => {
    try {
        // Buscar todos los roles incluyendo los permisos asociados
        const listaRoles = await Rol.findAll({
            include: [{ model: Permiso, as: 'permisos' }]
        });

        res.json({ listaRoles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener roles' });
    }
}

const getRol = async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar el rol por su ID incluyendo los permisos asociados
    const rol = await Rol.findByPk(id, {
      include: [{ model: Permiso, as: 'permisos' }],
    });

    if (!rol) {
      return res.status(404).json({ error: "No se encontró un rol con el ID proporcionado" });
    }

    res.json(rol);
  } catch (error) {
    console.error("Error al obtener el rol por ID:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};




const putRol = async (req, res = response) => {
  const { id } = req.params;
  const { nombre, estado, permisos } = req.body;

  try {
    const rol = await Rol.findByPk(id, {
      include: [{ model: Permiso, as: 'permisos' }],
    });

    if (!rol) {
      return res.status(404).json({ error: `No se encontró un rol con ID ${id}` });
    }
    // Validamos que el nuevo nombre no esté en uso por otro rol
if (nombre && nombre !== rol.nombre) {
  const rolWithSameName = await Rol.findOne({ where: { nombre } });
  if (rolWithSameName) {
    return res.status(400).json({ error: 'nombre del rol ya está en uso. Por favor, ingresa otro nombre.' });
  }
}

    // Actualizamos el nombre y el estado del rol
    await rol.update({ nombre, estado });

    // Si se proporcionan nuevos permisos, los actualizamos
    if (permisos && permisos.length > 0) {
      // Verificamos si los permisos son válidos
      const permisosValidos = await Permiso.findAll({ where: { id_permiso: permisos } });

      if (permisosValidos.length !== permisos.length) {
        return res.status(400).json({ error: "Uno o más permisos proporcionados son inválidos" });
      }

      // Identificamos los permisos que se deben eliminar y los que se deben agregar
      const permisosActuales = rol.permisos.map(permiso => permiso.id_permiso);
      const permisosEliminar = permisosActuales.filter(idPermiso => !permisos.includes(idPermiso));
      const permisosAgregar = permisos.filter(idPermiso => !permisosActuales.includes(idPermiso));

      // Eliminamos los permisos que ya no se requieren
      if (permisosEliminar.length > 0) {
        await rol.removePermisos(permisosEliminar);
      }

      // Agregamos los permisos nuevos
      if (permisosAgregar.length > 0) {
        await rol.addPermisos(permisosAgregar);
      }
    }

    res.json({
      msg: 'El rol fue actualizado exitosamente.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el rol' });
  }
}



const postRol = async (req, res = response) => {
  const { nombre, estado, permisos } = req.body;

  try {
    // Verifica si ya existe un rol con el mismo nombre
    const rolExistente = await Rol.findOne({ where: { nombre } });
    if (rolExistente) {
      return res.status(400).json({ error: 'El nombre del rol ya está en uso. Por favor, ingresa otro nombre.' });
    }

    // Crea el rol
    const nuevoRol = await Rol.create({ nombre, estado });

    // Verifica si se proporcionaron permisos y son válidos
    if (permisos && permisos.length > 0) {
      const permisosValidos = await Permiso.findAll({ where: { id_permiso: permisos } });

      if (permisosValidos.length !== permisos.length) {
        return res.status(400).json({ error: 'Uno o más permisos proporcionados son inválidos' });
      }

      // Asigna permisos al rol
      await nuevoRol.setPermisos(permisos);
    }

    res.json(nuevoRol);
  } catch (error) {
    console.error('Error al crear el rol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


const deleteRol = async (req, res = response) => {
  const { id } = req.params;

  try {
      const rol = await Rol.findByPk(id);
      if (!rol) {
          return res.status(404).json({ error: `No se encontró un rol con ID ${id}` });
      }

      await rol.destroy();
      res.json('El rol fue eliminado exitosamente');
  } catch (error) {
      if (error.name === 'SequelizeForeignKeyConstraintError') {
          return res.status(400).json({ error: 'Este rol tiene un usuario asociado.' });
      }

      console.error(error);
      res.status(500).json({ error: 'Error al eliminar el rol' });
  }
}





const asignarPermisoRol = async (req, res = response) => {
    const { id_rol, id_permisos } = req.body;
  
    try {
        // Buscar el rol por su ID
        const rol = await Rol.findByPk(id_rol);
      
        if (!rol) {
            return res.status(404).json({ error: "No se encontró un rol con el ID proporcionado" });
        }
      
        // Buscar los permisos por sus IDs
        const permisos = await Permiso.findAll({ where: { id_permiso: id_permisos } });
      
        if (!permisos || permisos.length === 0) {
            return res.status(404).json({ error: "No se encontraron permisos con los IDs proporcionados" });
        }
      
        // Asignar los permisos al rol
        await rol.setPermisos(permisos);
      
        // Retornar el rol actualizado con sus permisos
        const rolConPermisos = await Rol.findByPk(id_rol, {
            include: [{ model: Permiso, as: 'permisos' }],
        });
      
        res.json(rolConPermisos);
    } catch (error) {
        console.error("Error al asignar permisos al rol:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
    
};


const cambiarEstadoRol = async (req, res = response) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
      const rol = await Rol.findByPk(id);
      if (!rol) {
          return res.status(404).json({ error: `No se encontró un rol con ID ${id}` });
      }

      await rol.update({ estado });

      res.json({
          msg: 'El estado del rol fue actualizado exitosamente.'
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar el estado del rol' });
  }
}



module.exports = {
    getRol,
    getRoles,
    postRol,
    putRol,
    deleteRol,
    asignarPermisoRol,
    cambiarEstadoRol
};

