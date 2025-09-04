require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function testMisCompras() {
    try {
        console.log('🧪 PROBANDO API MIS COMPRAS');
        console.log('═════════════════════════════');

        // 1. Login con Cristian (cliente que tiene ventas)
        console.log('🔐 1. HACIENDO LOGIN...');
        const loginResponse = await axios.post(`${API_BASE_URL}/api/login`, {
            nombre_usuario: 'Cristian',
            contrasena: '12345678'
        });

        if (!loginResponse.data || !loginResponse.data.token) {
            console.log('❌ Error en login:', loginResponse.data);
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login exitoso');
        console.log('👤 Usuario:', loginResponse.data.usuario.nombre_usuario);
        console.log('🎭 Rol:', loginResponse.data.usuario.Rol.nombre);

        // 2. Llamar al endpoint Mis Compras
        console.log('\\n🛒 2. OBTENIENDO MIS COMPRAS...');
        const comprasResponse = await axios.get(`${API_BASE_URL}/api/ventas/cliente/mis-compras`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Respuesta exitosa');
        console.log('📊 Datos:', JSON.stringify(comprasResponse.data, null, 2));

        if (comprasResponse.data.ok) {
            console.log(`\\n🎯 RESULTADO:`);
            console.log(`   Total compras: ${comprasResponse.data.total}`);
            console.log(`   Compras encontradas: ${comprasResponse.data.ventas.length}`);
            
            if (comprasResponse.data.ventas.length > 0) {
                console.log('\\n📦 DETALLE DE COMPRAS:');
                comprasResponse.data.ventas.forEach((venta, index) => {
                    console.log(`   ${index + 1}. Venta #${venta.id_venta}`);
                    console.log(`      Fecha: ${venta.fecha_venta}`);
                    console.log(`      Total: $${venta.total_venta}`);
                    console.log(`      Cliente: ${venta.nombre_cliente}`);
                    console.log(`      Productos: ${venta.detalleVentas ? venta.detalleVentas.length : 'No disponible'}`);
                });
            } else {
                console.log('   📭 No hay compras registradas');
            }
        } else {
            console.log('❌ Error en la respuesta:', comprasResponse.data.mensaje);
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Ejecutar test
if (require.main === module) {
    testMisCompras();
}

module.exports = { testMisCompras }; 