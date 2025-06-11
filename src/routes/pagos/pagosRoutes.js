// routes/pagos/pagosRoutes.js
const { Router } = require('express');
const verificarToken = require('../../../middlewares/verificarToken');
const {
    obtenerBancosPSE,
    iniciarPagoPSE,
    consultarEstadoPagoPSE,
    manejarResultadoPago,
    recibirWebhookWompi,
    consultarEstadoPago,
    iniciarPagoEfectivo,
    consultarPagoEfectivo,
    confirmarPagoEfectivo,
    verificarPagos
} = require('../../controolers/pagos/pagosController');

const router = Router();

// Rutas PSE existentes
router.get('/bancos-pse', obtenerBancosPSE);
router.post('/pse/iniciar', verificarToken, iniciarPagoPSE);
router.get('/pse/estado/:referencia', consultarEstadoPagoPSE);

// Rutas para pagos en efectivo
router.post('/efectivo/iniciar', verificarToken, iniciarPagoEfectivo);
router.get('/efectivo/consultar/:codigo_pago', verificarToken, consultarPagoEfectivo);
router.post('/efectivo/confirmar/:codigo_pago', verificarToken, confirmarPagoEfectivo);

// Ruta de verificación
router.get('/verificar', verificarToken, verificarPagos);

// Rutas generales
router.get('/estado/:referencia', consultarEstadoPago);
router.get('/resultado/:referencia', manejarResultadoPago);
router.post('/webhook', recibirWebhookWompi);

module.exports = router;