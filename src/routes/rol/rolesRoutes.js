const { Router } = require('express');
const route = Router();
//const verificarToken = require('../middlewares/verificarToken');
const { getRol, getRoles, postRol, putRol, deleteRol, asignarPermisoRol,cambiarEstadoRol } = require('../../controolers/rol/rolesController');

//route.use(verificarToken);

route.get('/rol', getRoles);
route.get('/rol/:id', getRol);
route.post('/rol', postRol);
route.put('/rol/:id', putRol);
route.delete('/rol/:id', deleteRol);

//route.post('/rol/:id/cambiar-estado', cambiarEstadoRol); 
// Ruta para asignar permisos a un rol
//route.post('/asignar-permisos', asignarPermisoRol);
route.post('/rol/:id_rol/permisos', asignarPermisoRol);

module.exports = route;
