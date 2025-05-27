const { Router } = require('express');
const route = Router();
const iniciaSesion = require('../../controolers/inicioSesion/inicioSesionController');

route.post('/login', iniciaSesion.inicioSesion);

module.exports = route;