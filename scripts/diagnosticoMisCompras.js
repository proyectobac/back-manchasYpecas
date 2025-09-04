// scripts/diagnosticoMisCompras.js
require('dotenv').config();
const axios = require('axios');
const { sequelize } = require('../database/config');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function diagnosticarMisCompras() {
    console.log('🩺 DIAGNÓSTICO COMPLETO - MIS COMPRAS');
    console.log('═'.repeat(50));

    try {
        // 1. Verificar servidor
        console.log('🔍 1. VERIFICANDO SERVIDOR...');
        try {
            const serverCheck = await axios.get(`${API_BASE_URL}/api/usuarios/lista`);
            console.log('✅ Servidor funcionando');
        } catch (error) {
            console.log('❌ Servidor no disponible:', error.message);
            return;
        }

        // 2. Verificar base de datos
        console.log('\n🔍 2. VERIFICANDO BASE DE DATOS...');
        await sequelize.authenticate();
        console.log('✅ Conexión a BD exitosa');

        // Verificar usuarios
        const [usuarios] = await sequelize.query(`
            SELECT u.id_usuario, u.nombre_usuario, u.correo, u.telefono, r.nombre as rol_nombre 
            FROM usuarios u 
            LEFT JOIN roles r ON u.id_rol = r.id_rol 
            ORDER BY u.id_usuario
        `);
        
        console.log(`\n👥 USUARIOS EN EL SISTEMA (${usuarios.length}):`);
        usuarios.forEach(user => {
            console.log(`   ${user.id_usuario}. ${user.nombre_usuario} (${user.rol_nombre}) - Tel: ${user.telefono}`);
        });

        // Buscar un usuario cliente
        const cliente = usuarios.find(u => u.rol_nombre === 'Cliente');
        
        if (!cliente) {
            console.log('\n⚠️  NO HAY USUARIOS CON ROL CLIENTE');
            console.log('   Creando usuario cliente de prueba...');
            
            // Crear cliente de prueba
            const [nuevoUsuario] = await sequelize.query(`
                INSERT INTO usuarios (id_rol, nombre_usuario, correo, contrasena, telefono, estado) 
                VALUES (3, 'clientetest', 'cliente@test.com', '$2b$10$example.hash', '3001234567', 'Activo')
            `);
            console.log('✅ Usuario cliente creado');
            
            // Recargar usuarios
            const [usuariosActualizados] = await sequelize.query(`
                SELECT u.id_usuario, u.nombre_usuario, u.correo, u.telefono, r.nombre as rol_nombre 
                FROM usuarios u 
                LEFT JOIN roles r ON u.id_rol = r.id_rol 
                WHERE r.nombre = 'Cliente'
                ORDER BY u.id_usuario DESC LIMIT 1
            `);
            cliente = usuariosActualizados[0];
        }

        console.log(`\n🎯 USUARIO CLIENTE SELECCIONADO: ${cliente.nombre_usuario}`);

        // 3. Verificar ventas existentes
        console.log('\n🔍 3. VERIFICANDO VENTAS EXISTENTES...');
        const [ventas] = await sequelize.query(`
            SELECT v.id_venta, v.id_usuario, v.total_venta, v.nombre_cliente, u.nombre_usuario
            FROM ventas v
            LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
            ORDER BY v.id_venta
        `);

        console.log(`📦 Total ventas: ${ventas.length}`);
        if (ventas.length > 0) {
            ventas.forEach(venta => {
                console.log(`   Venta #${venta.id_venta}: Usuario ${venta.nombre_usuario || 'NULL'} - $${venta.total_venta}`);
            });
        }

        // Verificar ventas del cliente específico
        const ventasCliente = ventas.filter(v => v.id_usuario === cliente.id_usuario);
        console.log(`\n📋 VENTAS DEL CLIENTE ${cliente.nombre_usuario}: ${ventasCliente.length}`);

        // 4. Probar autenticación
        console.log('\n🔍 4. PROBANDO AUTENTICACIÓN...');
        
        // Probar login con diferentes contraseñas comunes
        const contrasenasPrueba = ['123456789', '12345678', '12345678S', 'password'];
        let token = null;
        
        for (const contrasena of contrasenasPrueba) {
            try {
                console.log(`   Probando contraseña: ${contrasena}`);
                const loginResponse = await axios.post(`${API_BASE_URL}/api/login`, {
                    nombre_usuario: cliente.nombre_usuario,
                    contrasena: contrasena
                });
                
                if (loginResponse.data && loginResponse.data.token) {
                    token = loginResponse.data.token;
                    console.log(`✅ Login exitoso con: ${contrasena}`);
                    break;
                }
            } catch (error) {
                console.log(`   ❌ Falló con: ${contrasena}`);
            }
        }

        if (!token) {
            console.log('❌ NO SE PUDO HACER LOGIN - Verificar contraseñas');
            return;
        }

        // 5. Probar endpoint Mis Compras
        console.log('\n🔍 5. PROBANDO ENDPOINT MIS COMPRAS...');
        try {
            const comprasResponse = await axios.get(`${API_BASE_URL}/api/ventas/cliente/mis-compras`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (comprasResponse.data && comprasResponse.data.ok) {
                console.log('✅ Endpoint funcionando correctamente');
                console.log(`   Total compras API: ${comprasResponse.data.total}`);
                console.log(`   Compras devueltas: ${comprasResponse.data.ventas ? comprasResponse.data.ventas.length : 0}`);
                
                if (ventasCliente.length !== comprasResponse.data.total) {
                    console.log('⚠️  DISCREPANCIA: BD vs API');
                    console.log(`   BD: ${ventasCliente.length} | API: ${comprasResponse.data.total}`);
                }
            } else {
                console.log('❌ Error en respuesta API:', comprasResponse.data);
            }
        } catch (error) {
            console.log('❌ Error al llamar API:', error.response?.data || error.message);
        }

        // 6. Verificar middleware y token
        console.log('\n🔍 6. VERIFICANDO TOKEN Y MIDDLEWARE...');
        
        // Decodificar token para verificar datos
        const jwt = require('jsonwebtoken');
        try {
            const decoded = jwt.decode(token);
            console.log('📄 DATOS DEL TOKEN:');
            console.log(`   userId: ${decoded.userId}`);
            console.log(`   rol: ${decoded.rol}`);
            console.log(`   exp: ${new Date(decoded.exp * 1000).toLocaleString()}`);
            
            if (decoded.userId !== cliente.id_usuario) {
                console.log('⚠️  PROBLEMA: ID usuario en token no coincide');
                console.log(`   Token: ${decoded.userId} | BD: ${cliente.id_usuario}`);
            }
            
            if (decoded.rol !== 'Cliente') {
                console.log('⚠️  PROBLEMA: Rol en token no es Cliente');
                console.log(`   Token: ${decoded.rol} | Esperado: Cliente`);
            }
        } catch (error) {
            console.log('❌ Error decodificando token:', error.message);
        }

        console.log('\n🎯 DIAGNÓSTICO COMPLETADO');
        
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error.message);
    } finally {
        await sequelize.close();
    }
}

// Ejecutar diagnóstico
if (require.main === module) {
    diagnosticarMisCompras();
}

module.exports = { diagnosticarMisCompras }; 