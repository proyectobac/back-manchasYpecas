const { Router } = require('express');
const router = Router();  
const verificarToken = require('../../../middlewares/verificarToken');
const upload = require('../../../middlewares/multer');
const { getUsuarios, getUsuario, postUsuario, putUsuario, deleteUsuario, actualizarPerfil, actualizarEstadoUsuario, uploadFoto} = require('../../controolers/usuarios/usuariosController');

router.get('/usuario', getUsuarios);
router.get('/usuario/:id', getUsuario);
router.post('/usuario', postUsuario);
router.put('/usuario/:id', putUsuario);
router.delete('/usuario/:id', deleteUsuario);
router.put('/actualizarPerfil', verificarToken, actualizarPerfil);
router.put('/:id/estado', actualizarEstadoUsuario); 
router.post('/upload-foto', verificarToken, upload.single('foto'), uploadFoto);

module.exports = router;
