// routes/ventasRoutes.js
const { Router } = require('express');
const route = Router();
const verificarToken = require('../../../middlewares/verificarToken'); // Asume que tienes este middleware

const {
    createVenta,
    getVentas,
    getVentaById
} = require('../../controolers/ventas/ventasController'); // Ajusta ruta

// Crear una nueva venta (pedido de cliente)
// Asumimos que esta ruta puede ser pública o requerir autenticación de cliente si tienes login de clientes
route.post('/ventas', /* verificarToken (si aplica), */ createVenta);

// Obtener historial de ventas (probablemente ruta protegida para admin)
route.get('/ventas', verificarToken, getVentas);

// Obtener una venta específica (probablemente ruta protegida para admin)
route.get('/ventas/:id', verificarToken, getVentaById);

// Podrías añadir rutas PUT para actualizar estado (ej: marcar como 'Enviada')
// route.put('/ventas/:id/estado', verificarToken, updateEstadoVenta); // Necesitarías crear esta función

module.exports = route;
