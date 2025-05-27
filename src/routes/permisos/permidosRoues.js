const { Router } = require('express');
const route = Router();

const { getPermiso, getPermisos, postPermiso, editPermiso, deletePermiso, asignarPermisoARol } = require('../../controolers/permisos/permisosController');

// Rutas públicas sin token
route.get('/permisos', getPermisos);
route.post('/permisos', postPermiso);
route.get('/permisos/:id', getPermiso);
route.put('/permisos/:id', editPermiso); // Ruta para editar un permiso existente
route.delete('/permisos/:id',  deletePermiso); // Ruta para eliminar un permiso existente

//route.post('/asignar-permisos',asignarPermisoARol);

module.exports = route;
