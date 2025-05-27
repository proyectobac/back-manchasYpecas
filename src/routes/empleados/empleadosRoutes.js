const {Router} = require('express')
const route = Router()
const verificarToken = require('../../../middlewares/verificarToken');
const upload = require('../../../middlewares/multer');


const { getEmpleados, getEmpleado, postEmpleado, putEmpleado, cambiarEstadoEmpleado, getValidarDocumento, getEmpleadosActivos, deleteEmpleado} = require ('../../controolers/Empleados/empleadosController');

route.delete('/empleado/:id', verificarToken, deleteEmpleado);
route.get('/empleado', verificarToken, getEmpleados);
route.get('/empleado/activos', verificarToken, getEmpleadosActivos);
route.get('/empleado/:id',verificarToken, getEmpleado);
route.post('/empleado', verificarToken, upload.single('foto'), postEmpleado);
route.put('/empleado/:id', verificarToken, putEmpleado);
route.put('/empleado/cambiarEstado/:id', verificarToken, cambiarEstadoEmpleado);
route.get('/validar', verificarToken, getValidarDocumento);


module.exports = route;