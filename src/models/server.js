const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
require('dotenv').config();
const Rol = require('../models/rol/rolesModel');
const Usuario = require('../models/usuarios/usuariosModel');
const initModels = require('./initModels');

const inicioSesion = require('../controolers/inicioSesion/inicioSesionController');
const recuperarContrasena = require('../controolers/resetpaassword/resetpassword');
const solicitarRestablecimiento = require('../controolers/resetpaassword/resetpassword');
const editarPerfil = require('../controolers/usuarios/usuariosController');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.path = '/api';
    this.app.use(bodyParser.json()); // Agrega este middleware para parsear JSON
    // Llamadas a otros métodos
    this.middlewares();
    this.routes();
    this.createServer();
    this.inicializarBaseDeDatos();
    initModels();
  }

  createServer() {
    this.server = http.createServer(this.app);
  }

  listen() {
    this.server.listen(this.port, () => {
      console.log(`Está escuchando por el puerto ${this.port}`);
    });
  }
  middlewares() {
    const corsOptions = {
      origin: [
        'http://localhost:3000', 'http://localhost:3001',
        'https://manchas-back-end.onrender.com',
        'https://manchasypecas.vercel.app', // url vecel oficial
        'manchasypecas-lq1984kbv-manchasypecas22s-projects.vercel.app', // url inicial al desplegar
        'manchasypecas-git-main-manchasypecas22s-projects.vercel.app', // url inicial al desplegar
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    };
    this.app.use(cors(corsOptions));
    this.app.use((req, res, next) => {
      res.setHeader('Cache-Control', 'no-store');
      next();
    });
  }



  async inicializarBaseDeDatos() {
    try {
      const Rol = require('./rol/rolesModel');
      const Usuario = require('./usuarios/usuariosModel');
      const Permiso = require('./permisos/permisosModels');
      const RolPermiso = require('./rolPermiso/permisosRol');

      // 1. Crear Roles por defecto si no existen
      const rolesPorDefecto = [
        { nombre: 'SuperAdmin', estado: 'Activo' },
        { nombre: 'Empleado', estado: 'Activo' },
        { nombre: 'Cliente', estado: 'Activo' }
      ];
      for (const rol of rolesPorDefecto) {
        await Rol.findOrCreate({
          where: { nombre: rol.nombre },
          defaults: { estado: rol.estado }
        });
      }
      console.log('Roles inicializados.');

      // 2. Crear Permisos por defecto si no existen
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
        { nombre_permiso: 'Ventas', ruta: 'lista/ventas' },
        { nombre_permiso: 'Configuracion', ruta: '/usuarios/lista' },
        { nombre_permiso: 'roles', ruta: '/roles/lista' },

        { nombre_permiso: 'mi portal', ruta: '/permisoDasboardEmpleado' },
        { nombre_permiso: 'resultadopago', ruta: '/resultado-pago/:referencia' },
      ];
      for (const permiso of permisosPorDefecto) {
        await Permiso.findOrCreate({
          where: { nombre_permiso: permiso.nombre_permiso },
          defaults: { ruta: permiso.ruta }
        });
      }
      console.log('Permisos inicializados.');

      // 3. Crear Usuario por defecto si no existe
      const [usuarioPorDefecto] = await Usuario.findOrCreate({
        where: { correo: 'sionbarbershop5@gmail.com' },
        defaults: {
          id_rol: 1, // Asociado al rol de SuperAdmin
          nombre_usuario: 'Admin',
          contrasena: '12345678S', // ¡Considera hashear la contraseña!
          telefono: '+3146753115',
          estado: 'Activo'
        }
      });
      console.log('Usuario por defecto (SuperAdmin) inicializado.');

      // 4. Obtener todos los permisos
      const permisos = await Permiso.findAll();

      // 5. Asignar permisos a los roles
      const rolSuperAdmin = await Rol.findOne({ where: { nombre: 'SuperAdmin' } });
      const rolEmpleado = await Rol.findOne({ where: { nombre: 'Empleado' } });
      const rolCliente = await Rol.findOne({ where: { nombre: 'Cliente' } });

      // Asignar todos los permisos a SuperAdmin
      if (rolSuperAdmin && permisos.length > 0) {
        for (const permiso of permisos) {
          await RolPermiso.findOrCreate({
            where: { id_rol: rolSuperAdmin.id_rol, id_permiso: permiso.id_permiso }
          });
        }
        console.log('Todos los permisos asignados a SuperAdmin.');
      }

      // Asignar permisos específicos a Empleado (solo "Crear Compras" y "lista Compras")
      if (rolEmpleado) {
        // const permisoCrearCompras = await Permiso.findOne({ where: { nombre_permiso: 'Crear Compras' } });
        const permisoListaVentas = await Permiso.findOne({ where: { nombre_permiso: 'Ventas' } });

        // const permisoDasboardEmpleado = await Permiso.findOne({ where: { nombre_permiso: 'mi portal' } });

        // if (permisoDasboardEmpleado) {
        //   await RolPermiso.findOrCreate({
        //     where: { id_rol: rolEmpleado.id_rol, id_permiso: permisoDasboardEmpleado.id_permiso }
        //   });
        //   console.log('Permiso "Mi portal " asignado a Empleado.');
        // }


           if (permisoListaVentas) {
          await RolPermiso.findOrCreate({
            where: { id_rol: rolEmpleado.id_rol, id_permiso: permisoListaVentas.id_permiso }
          });
          console.log('Permiso "lista de ventas" asignado a Empleado.');
        }
        // if (permisoCrearCompras) {
        //   await RolPermiso.findOrCreate({
        //     where: { id_rol: rolEmpleado.id_rol, id_permiso: permisoCrearCompras.id_permiso }
        //   });
        //   console.log('Permiso "Crear Compras" asignado a Empleado.');
        // }
      

        // if (permisoListaCompras) {
        //   await RolPermiso.findOrCreate({
        //     where: { id_rol: rolEmpleado.id_rol, id_permiso: permisoListaCompras.id_permiso }
        //   });
        //   console.log('Permiso "lista Compras" asignado a Empleado.');
        // }
      }

      // No asignar permisos a Cliente (solo se crea el rol, pero sin permisos)
      if (rolCliente) {

        const permisoTienda = await Permiso.findOne({ where: { nombre_permiso: 'Tienda' } });

        if (permisoTienda) {
          await RolPermiso.findOrCreate({
            where: { id_rol: rolCliente.id_rol, id_permiso: permisoTienda.id_permiso }
          });
          console.log('Permiso "Tienda " Asignado  a Cliente.');
        }

      }

      // 6. Asociar todos los permisos al usuario por defecto (SuperAdmin)
      await usuarioPorDefecto.setPermisos(permisos);
      console.log('Permisos asociados directamente al usuario SuperAdmin.');

      console.log('Base de datos inicializada correctamente.');
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
    }
  }

  routes() {
    // Rutas de autenticación y perfil (estas están bien porque usan controladores)
    this.app.post(`${this.path}/login`, inicioSesion.iniciarSesion);
    this.app.post(`${this.path}/cambiar-contrasena`, recuperarContrasena.cambiarContrasena);
    this.app.post(`${this.path}/solicitar-restablecimiento`, solicitarRestablecimiento.solicitarRestablecimiento);
    this.app.post(`${this.path}/actualizarPerfil`, editarPerfil.actualizarPerfil);

    // Rutas de los modelos y controladores
    this.app.use(`${this.path}/upload`, require('../routes/adminProfile/adminProfileRoutes'));

    // Ejemplo de cómo manejar rutas para permisos, roles y usuarios
    // Asumiendo que tienes controladores para estas entidades
    this.app.use(`${this.path}/permisos`, require('../routes/permisos/permidosRoues'));
    this.app.use(`${this.path}/roles`, require('../routes/rol/rolesRoutes'));
    this.app.use(`${this.path}/usuarios`, require('../routes/usuarios/usuariosRoutes'));
    this.app.use(`${this.path}/productos`, require('../routes/productos/productosRoutes'));
    this.app.use(`${this.path}/proveedores`, require('../routes/proveedores/proveedoresRoutes'));
    this.app.use(`${this.path}/compras`, require('../routes/compras/comprasRoutes'));
    this.app.use(`${this.path}/empleados`, require('../routes/empleados/empleadosRoutes'));
    this.app.use(`${this.path}/ventas`, require('../routes/ventas/ventasRotes'));
    this.app.use(`${this.path}/pagos`, require('../routes/pagos/pagosRoutes'));
    this.app.use(`${this.path}/clientes`, require('../routes/clientes/clientesRoutes'));

  }
  handleErrors() {
    // Coloca el middleware de manejo de errores al final de la cadena de middlewares
    this.app.use(errorHandler);
  }

}



module.exports = Server;  