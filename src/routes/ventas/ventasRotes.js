// routes/ventasRoutes.js
const { Router } = require('express');
const route = Router();
const verificarToken = require('../../../middlewares/verificarToken'); // Asume que tienes este middleware
const verificarCliente = require('../../../middlewares/verificarCliente'); // Middleware para validar que sea cliente
const upload = require('../../../middlewares/multer'); // Importar multer para manejar la subida de archivos

const {
    createVenta,
    getVentas,
    getVentaById,
    confirmDelivery,
    crearVentaManual,
    marcarComoEnviada,
    getMisComprasCliente,
    getDetalleCompraCliente
} = require('../../controolers/ventas/ventasController'); // Ajusta ruta


route.post('/ven', verificarToken , crearVentaManual);

// Crear una nueva venta (pedido de cliente)
route.post('/ventas', verificarToken, createVenta);

// Obtener historial de ventas (probablemente ruta protegida para admin)
route.get('/ventas', verificarToken, getVentas);



// Obtener una venta específica (probablemente ruta protegida para admin)
route.get('/ventas/:id', verificarToken, getVentaById);

// Confirmar entrega con imagen (solo para ventas PSE)
route.post('/ventas/:id/confirm-delivery', 
    verificarToken, 
    upload.single('confirmation_image'), 
    confirmDelivery
);

// Podrías añadir rutas PUT para actualizar estado (ej: marcar como 'Enviada')
// route.put('/ventas/:id/estado', verificarToken, updateEstadoVenta); // Necesitarías crear esta función
// ... al lado de tus otras rutas ...

// Marcar una venta como Enviada
route.put('/ventas/:id/marcar-enviada', verificarToken, marcarComoEnviada);

// =====================================================================
// ==                  RUTAS ESPECÍFICAS PARA CLIENTES              ==
// =====================================================================

// Obtener las compras del cliente autenticado
route.get('/cliente/mis-compras', verificarToken, verificarCliente, getMisComprasCliente);

// Obtener el detalle de una compra específica del cliente autenticado
route.get('/cliente/compra/:id', verificarToken, verificarCliente, getDetalleCompraCliente);

module.exports = route;