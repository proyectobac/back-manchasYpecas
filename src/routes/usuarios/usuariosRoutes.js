const { Router } = require('express');
const router = Router();  
const verificarToken = require('../../../middlewares/verificarToken');
const { getUsuarios, getUsuario, postUsuario, putUsuario, deleteUsuario, actualizarPerfil, actualizarEstadoUsuario} = require('../../controolers/usuarios/usuariosController');

router.get('/usuario', getUsuarios);
router.get('/usuario/:id', getUsuario);
router.post('/usuario', postUsuario);
router.put('/usuario/:id', putUsuario);
router.delete('/usuario/:id', deleteUsuario);
router.put('/actualizarPerfil', verificarToken, actualizarPerfil);
router.put('/:id/estado', actualizarEstadoUsuario); 
module.exports = router;
