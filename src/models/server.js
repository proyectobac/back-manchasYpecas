const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
require('dotenv').config();
const Rol = require('../models/rol/rolesModel');
const Usuario = require('../models/usuarios/usuariosModel');
const initModels = require('./initModels');

const inicioSesion = require('../controolers/inicioSesion/inicioSesionController');
const { solicitarRestablecimiento, cambiarContrasena } = require('../controolers/resetpaassword/resetpassword');
const { actualizarPerfil } = require('../controolers/usuarios/usuariosController');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.apiPath = '/api';
    this.app.use(bodyParser.json({ limit: '50mb' }));
    this.app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
    this.middlewares();
    this.routes();
    this.createServer();
    this.serveFrontend();
    this.inicializarBaseDeDatos();
    initModels();
  }

  createServer() {
    this.server = http.createServer(this.app);
  }

  listen() {
    this.server.listen(this.port, () => {
      console.log('🚀 Servidor corriendo en puerto', this.port);
      console.log(`   - Ambiente: ${process.env.NODE_ENV || 'desarrollo'}`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`   - API disponible en: http://localhost:${this.port}${this.apiPath}`);
      }
    });
  }

  middlewares() {
    // Configuración de CORS más robusta para producción
    const whitelist = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.NGROK_URL
    ].filter(Boolean); // Elimina valores undefined/null

    const corsOptions = {
      origin: function (origin, callback) {
        // Permitir solicitudes sin origin (como las aplicaciones móviles o Postman)
        if (!origin || whitelist.includes(origin) || origin.endsWith('.ngrok-free.app')) {
          callback(null, true);
        } else {
          callback(new Error('No permitido por CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      maxAge: 600 // 10 minutos de cache para las opciones preflight
    };

    // Middlewares esenciales
    this.app.use(cors(corsOptions));

    // Middleware de seguridad básica
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });

    // Servir archivos estáticos del frontend
    if (process.env.NODE_ENV === 'production') {
      this.app.use(express.static(path.join(__dirname, '../../frontend/build')));
    }

    // Desactivar la caché para desarrollo
    if (process.env.NODE_ENV !== 'production') {
      this.app.use((req, res, next) => {
        res.setHeader('Cache-Control', 'no-store');
        next();
      });
    }
  }

  async inicializarBaseDeDatos() {
    try {
      const Rol = require('../models/rol/rolesModel');
      const Usuario = require('../models/usuarios/usuariosModel');
      const Permiso = require('../models/permisos/permisosModels');
      const RolPermiso = require('../models/rolPermiso/permisosRol');
  
      // Solo inicializar datos por defecto en desarrollo o en el primer despliegue
      if (process.env.NODE_ENV !== 'production' || process.env.INIT_DB === 'true') {
        const rolesPorDefecto = [
          { nombre: 'SuperAdmin', estado: 'Activo' },
          { nombre: 'Empleado', estado: 'Activo' },
          { nombre: 'Cliente', estado: 'Activo' }
        ];
        await Promise.all(rolesPorDefecto.map(rol => 
          Rol.findOrCreate({ where: { nombre: rol.nombre }, defaults: rol })
        ));
        console.log('✅ Roles inicializados');
        
        const permisosPorDefecto = [
          { nombre_permiso: 'Inicio', ruta: '/inicio' },
          { nombre_permiso: 'Crear Empleado', ruta: '/empleados/crear' },
          { nombre_permiso: 'Lista Empleado', ruta: '/empleados/lista' },
          { nombre_permiso: 'Crear Producto', ruta: '/productos/crear' },
          { nombre_permiso: 'Lista Productos', ruta: '/productos/lista' },
          { nombre_permiso: 'Crear Proveedor', ruta: '/proveedor/crear' },
          { nombre_permiso: 'lista Proveedores', ruta: '/proveedor/lista' },
          { nombre_permiso: 'Crear Compras', ruta: '/compras/crear' },
          { nombre_permiso: 'lista Compras', ruta: '/compras/lista' },
          { nombre_permiso: 'Tienda', ruta: '/tienda' },
          { nombre_permiso: 'Ventas', ruta: '/lista/ventas' },
          { nombre_permiso: 'Configuracion', ruta: '/usuarios/lista' },
          { nombre_permiso: 'roles', ruta: '/roles/lista' },
          { nombre_permiso: 'mi portal', ruta: '/permisoDasboardEmpleado' },
          { nombre_permiso: 'resultadopago', ruta: '/resultado-pago/:referencia' }
        ];
        
        await Promise.all(permisosPorDefecto.map(p => 
          Permiso.findOrCreate({ 
            where: { nombre_permiso: p.nombre_permiso }, 
            defaults: { ...p, ruta: p.ruta.trim() } 
          })
        ));
        console.log('✅ Permisos inicializados');
      }

      console.log('✅ Base de datos inicializada correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar la base de datos:', error);
      // En producción, podrías querer notificar a un servicio de monitoreo
      if (process.env.NODE_ENV === 'production') {
        // Aquí podrías integrar con un servicio de monitoreo como Sentry
      }
    }
  }

  routes() {
    const apiPrefix = this.apiPath;

    // Rutas de la API
    this.app.post(`${apiPrefix}/login`, inicioSesion.iniciarSesion);
    this.app.post(`${apiPrefix}/solicitar-restablecimiento`, solicitarRestablecimiento);
    this.app.post(`${apiPrefix}/cambiar-contrasena`, cambiarContrasena);
    this.app.post(`${apiPrefix}/actualizarPerfil`, actualizarPerfil);
    
    // Importación de rutas
    this.app.use(`${apiPrefix}/upload`, require('../routes/adminProfile/adminProfileRoutes'));
    this.app.use(`${apiPrefix}/permisos`, require('../routes/permisos/permidosRoues'));
    this.app.use(`${apiPrefix}/roles`, require('../routes/rol/rolesRoutes'));
    this.app.use(`${apiPrefix}/usuarios`, require('../routes/usuarios/usuariosRoutes'));
    this.app.use(`${apiPrefix}/productos`, require('../routes/productos/productosRoutes'));
    this.app.use(`${apiPrefix}/proveedores`, require('../routes/proveedores/proveedoresRoutes'));
    this.app.use(`${apiPrefix}/compras`, require('../routes/compras/comprasRoutes'));
    this.app.use(`${apiPrefix}/empleados`, require('../routes/empleados/empleadosRoutes'));
    this.app.use(`${apiPrefix}/ventas`, require('../routes/ventas/ventasRotes'));
    this.app.use(`${apiPrefix}/pagos`, require('../routes/pagos/pagosRoutes'));
    this.app.use(`${apiPrefix}/clientes`, require('../routes/clientes/clientesRoutes'));

    // Manejador de errores global
    this.app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message
      });
    });
  }

  serveFrontend() {
    // Servir la aplicación React en producción
    if (process.env.NODE_ENV === 'production') {
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
      });
    }
  }
}

module.exports = Server;  