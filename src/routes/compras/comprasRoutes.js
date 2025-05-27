// routes/comprasRoutes.js
const { Router } = require('express');
const route = Router();
const verificarToken = require('../../../middlewares/verificarToken'); // Asegúrate que la ruta al middleware sea correcta

const {
    createCompra,
    getCompras,
    getCompraById,
    updateCompraEstado,
    updateCompra,
    deleteCompra
} = require('../../controolers/compras/comprasController'); // Ajusta la ruta al controlador

// Crear una nueva compra (POST)
route.post('/compras', verificarToken, createCompra);

// Obtener todas las compras (GET)
route.get('/compras', verificarToken, getCompras);

// Obtener una compra por ID (GET)
route.get('/compras/:id', verificarToken, getCompraById);

// Actualizar estado de una compra (PUT) - Opcional
route.put('/compras/:id/estado', verificarToken, updateCompraEstado);

route.put('/compras/:id', verificarToken, updateCompra); // <--- USA ESTA RUTA


// Eliminar una compra (DELETE) - ¡Usar con extrema precaución! Opcional
route.delete('/compras/:id', verificarToken, deleteCompra);

module.exports = route;