const { Router } = require('express');
const route = Router();
const verificarToken = require('../../../middlewares/verificarToken');
const upload = require('../../../middlewares/multer');

const { getProductos, getProducto, postProducto, putProducto, deleteProducto } = require('../../controolers/productos/productosController');

route.get('/producto', getProductos);
route.get('/producto/:id',verificarToken, getProducto);
route.post('/producto',verificarToken, upload.single('foto'), postProducto);
route.put('/producto/:id',verificarToken, upload.single('foto'), putProducto);
route.delete('/producto/:id',verificarToken, deleteProducto);

module.exports = route;
