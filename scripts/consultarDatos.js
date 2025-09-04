// scripts/consultarDatos.js
require('dotenv').config();

const { sequelize } = require('../database/config');
const Usuario = require('../src/models/usuarios/usuariosModel');
const Producto = require('../src/models/productos/productosModel');
const Ventas = require('../src/models/ventas/ventasModel');
const Roles = require('../src/models/rol/rolesModel');
const initModels = require('../src/models/initModels');

async function consultarUsuarios() {
    console.log('👥 USUARIOS EN LA BASE DE DATOS:');
    console.log('━'.repeat(50));
    
    try {
        const usuarios = await Usuario.findAll({
            include: [
                {
                    model: Roles,
                    attributes: ['nombre']
                }
            ],
            attributes: ['id_usuario', 'nombre_usuario', 'correo', 'telefono', 'estado']
        });

        if (usuarios.length === 0) {
            console.log('❌ No se encontraron usuarios');
            return [];
        }

        usuarios.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.id_usuario}`);
            console.log(`   Usuario: ${user.nombre_usuario}`);
            console.log(`   Email: ${user.correo}`);
            console.log(`   Teléfono: ${user.telefono || 'No especificado'}`);
            console.log(`   Rol: ${user.Rol?.nombre || 'Sin rol asignado'}`);
            console.log(`   Estado: ${user.estado}`);
            console.log('');
        });

        return usuarios;
    } catch (error) {
        console.error('❌ Error al consultar usuarios:', error.message);
        return [];
    }
}

async function consultarProductos() {
    console.log('📦 PRODUCTOS EN LA BASE DE DATOS:');
    console.log('━'.repeat(50));
    
    try {
        const productos = await Producto.findAll({
            attributes: ['id_producto', 'nombre', 'descripcion', 'precioVenta', 'stock', 'estado'],
            limit: 10
        });

        if (productos.length === 0) {
            console.log('❌ No se encontraron productos');
            return [];
        }

        productos.forEach((prod, index) => {
            console.log(`${index + 1}. ID: ${prod.id_producto}`);
            console.log(`   Nombre: ${prod.nombre}`);
            console.log(`   Descripción: ${prod.descripcion || 'Sin descripción'}`);
            console.log(`   Precio: $${prod.precioVenta || 0}`);
            console.log(`   Stock: ${prod.stock || 0} unidades`);
            console.log(`   Estado: ${prod.estado}`);
            console.log('');
        });

        return productos;
    } catch (error) {
        console.error('❌ Error al consultar productos:', error.message);
        return [];
    }
}

async function consultarVentas() {
    console.log('🛒 VENTAS EXISTENTES:');
    console.log('━'.repeat(50));
    
    try {
        const ventas = await Ventas.findAll({
            attributes: ['id_venta', 'id_usuario', 'total_venta', 'estado_venta', 'numero_referencia', 'nombre_cliente', 'fecha_venta'],
            limit: 10,
            order: [['fecha_venta', 'DESC']]
        });

        if (ventas.length === 0) {
            console.log('❌ No se encontraron ventas');
            return [];
        }

        ventas.forEach((venta, index) => {
            console.log(`${index + 1}. ID Venta: ${venta.id_venta}`);
            console.log(`   ID Usuario: ${venta.id_usuario}`);
            console.log(`   Cliente: ${venta.nombre_cliente}`);
            console.log(`   Referencia: ${venta.numero_referencia}`);
            console.log(`   Total: $${venta.total_venta}`);
            console.log(`   Estado: ${venta.estado_venta}`);
            console.log(`   Fecha: ${venta.fecha_venta}`);
            console.log('');
        });

        return ventas;
    } catch (error) {
        console.error('❌ Error al consultar ventas:', error.message);
        return [];
    }
}

async function consultarRoles() {
    console.log('🔐 ROLES EN EL SISTEMA:');
    console.log('━'.repeat(50));
    
    try {
        const roles = await Roles.findAll({
            attributes: ['id_rol', 'nombre', 'descripcion']
        });

        if (roles.length === 0) {
            console.log('❌ No se encontraron roles');
            return [];
        }

        roles.forEach((rol, index) => {
            console.log(`${index + 1}. ID: ${rol.id_rol}`);
            console.log(`   Nombre: ${rol.nombre}`);
            console.log(`   Descripción: ${rol.descripcion || 'Sin descripción'}`);
            console.log('');
        });

        return roles;
    } catch (error) {
        console.error('❌ Error al consultar roles:', error.message);
        return [];
    }
}

async function main() {
    console.log('🔍 CONSULTANDO DATOS DE LA BASE DE DATOS');
    console.log('═'.repeat(60));
    console.log('');

    try {
        // Inicializar modelos
        initModels();

        // Consultar roles
        await consultarRoles();
        
        // Consultar usuarios
        const usuarios = await consultarUsuarios();
        
        // Consultar productos
        const productos = await consultarProductos();
        
        // Consultar ventas
        const ventas = await consultarVentas();

        // Resumen
        console.log('📊 RESUMEN:');
        console.log('━'.repeat(50));
        console.log(`Total usuarios: ${usuarios.length}`);
        console.log(`Total productos: ${productos.length}`);
        console.log(`Total ventas: ${ventas.length}`);

        // Verificar si hay un cliente específico
        const clienteTest = usuarios.find(u => u.nombre_usuario === 'ClienteTest');
        if (clienteTest) {
            console.log(`\n✅ Usuario ClienteTest encontrado (ID: ${clienteTest.id_usuario})`);
            
            // Buscar ventas del cliente
            const ventasCliente = ventas.filter(v => v.id_usuario === clienteTest.id_usuario);
            console.log(`   Compras del cliente: ${ventasCliente.length}`);
        } else {
            console.log('\n⚠️  Usuario ClienteTest NO encontrado');
        }

        // Verificar productos con stock
        const productosConStock = productos.filter(p => p.stock > 0 && p.estado === 'Activo');
        console.log(`\nProductos disponibles para venta: ${productosConStock.length}`);

    } catch (error) {
        console.error('💥 Error fatal:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = { 
    consultarUsuarios, 
    consultarProductos, 
    consultarVentas, 
    consultarRoles 
}; 