// routes/pagos/pagosRoutes.js
const express = require('express');
const pagosController = require('../../controolers/pagos/pagosController');
const verificarToken = require('../../../middlewares/verificarToken');
const router = express.Router();

// Rutas públicas para PSE
router.get('/bancos-pse', pagosController.obtenerBancosPSE);
router.get('/pse/estado/:referencia', pagosController.consultarEstadoPagoPSE);
router.get('/estado/:referencia', pagosController.consultarEstadoPago); // Mantener por compatibilidad

// Rutas protegidas PSE (requieren autenticación)
router.post('/pse/iniciar', verificarToken, pagosController.iniciarPagoPSE);

// Webhook de Wompi (debe ser público y verificar firma internamente)
router.post('/webhook-wompi', pagosController.recibirWebhookWompi);

// Puedes añadir más rutas para otros métodos de pago si los implementas
// router.post('/iniciar-tarjeta', verificarToken, pagosController.iniciarPagoTarjeta);

module.exports = router;