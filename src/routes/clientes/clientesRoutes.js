const { Router } = require('express');
const route = Router();
const verificarToken = require('../../../middlewares/verificarToken');

const {
  getClientes,
  getCliente,
  postCliente,
  putCliente,
  deleteCliente,
} = require('../../controllers/clientes/clientesController');

// Obtener todos los clientes
route.get('/cliente', verificarToken, getClientes);

// Obtener un cliente por ID
route.get('/cliente/:id', verificarToken, getCliente);

// Crear un nuevo cliente
route.post('/cliente', verificarToken, postCliente);

// Actualizar un cliente
route.put('/cliente/:id', verificarToken, putCliente);

// Eliminar un cliente
route.delete('/cliente/:id', verificarToken, deleteCliente);

module.exports = route; 