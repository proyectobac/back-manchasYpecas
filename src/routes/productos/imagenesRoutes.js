const { Router } = require('express');
const route = Router();
const { getProductosFromImagenes, servirImagen } = require('../../controolers/productos/imagenesController');

// Ruta para obtener todos los productos basados en las imágenes
route.get('/productos-imagenes', getProductosFromImagenes);

// Ruta para servir imágenes
route.get('/imagen/:categoria/:imagen', servirImagen);

module.exports = route; 