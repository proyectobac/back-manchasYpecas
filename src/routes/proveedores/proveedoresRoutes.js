const { Router } = require('express');
const route = Router();
const verificarToken = require('../../../middlewares/verificarToken');


const { getProveedor,getProveedores, postProveedor, putProveedor, deleteProveedor, getProveedorProductos, cambiarEstadoProveedor, getProveedoresActivos } = require('../../controolers/proveedores/proveedoresController');

route.get('/proveedores',verificarToken, getProveedores);
route.get('/proveedores',verificarToken, getProveedores);
route.get('/proveedores/activos',verificarToken, getProveedoresActivos);
route.get('/proveedores/:id',verificarToken, getProveedor);
route.get('/proveedores/productos/:id',verificarToken, getProveedorProductos);
route.post('/proveedores',verificarToken, postProveedor);
route.put('/proveedores/:id',verificarToken, putProveedor);
route.put('/proveedores/:id/cambiarestado', cambiarEstadoProveedor);
route.delete('/proveedores/:id', verificarToken, deleteProveedor);

module.exports = route;
