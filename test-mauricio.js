const axios = require('axios');

async function testMauricio() {
    try {
        console.log('🔐 PROBANDO LOGIN Y COMPRAS DE MAURICIO');
        console.log('════════════════════════════════════════');
        
        // 1. Login con Mauricio
        const loginResponse = await axios.post('http://localhost:3000/api/login', {
            nombre_usuario: 'Mauricio',
            contrasena: '12345678'
        });
        
        if (!loginResponse.data || !loginResponse.data.token) {
            console.log('❌ Error en login:', loginResponse.data);
            return;
        }
        
        console.log('✅ Login exitoso');
        console.log('👤 Usuario:', loginResponse.data.usuario.nombre_usuario);
        console.log('🆔 User ID:', loginResponse.data.usuario.userId);
        console.log('🎭 Rol:', loginResponse.data.usuario.rol.nombre);
        
        const token = loginResponse.data.token;
        
        // 2. Consultar Mis Compras
        console.log('\n🛒 CONSULTANDO MIS COMPRAS...');
        const comprasResponse = await axios.get('http://localhost:3000/api/ventas/cliente/mis-compras', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 RESULTADO:');
        console.log('Status:', comprasResponse.status);
        console.log('Data:', JSON.stringify(comprasResponse.data, null, 2));
        
        // 3. Análisis del resultado
        if (comprasResponse.data.ok) {
            console.log('\n🎯 ANÁLISIS:');
            console.log('Total compras:', comprasResponse.data.total);
            console.log('Ventas confirmadas:', comprasResponse.data.resumen?.ventas_confirmadas || 0);
            console.log('Pagos pendientes:', comprasResponse.data.resumen?.pagos_pendientes || 0);
            
            if (comprasResponse.data.ventas && comprasResponse.data.ventas.length > 0) {
                console.log('\n📦 DETALLE DE COMPRAS:');
                comprasResponse.data.ventas.forEach((compra, index) => {
                    console.log(`\n   ${index + 1}. ${compra.tipo === 'pago_pendiente' ? 'PAGO PENDIENTE' : 'VENTA CONFIRMADA'}`);
                    console.log(`      ID: ${compra.id_venta}`);
                    console.log(`      Referencia: ${compra.numero_referencia || compra.codigo_pago}`);
                    console.log(`      Estado: ${compra.estado_venta}`);
                    console.log(`      Total: $${compra.total_venta}`);
                    console.log(`      Fecha: ${compra.fecha_venta}`);
                    if (compra.fecha_vencimiento) {
                        console.log(`      Vence: ${compra.fecha_vencimiento}`);
                    }
                });
            } else {
                console.log('\n📭 No hay compras para mostrar');
            }
        } else {
            console.log('❌ Error en la respuesta:', comprasResponse.data.msg);
        }
        
    } catch (error) {
        console.error('\n❌ ERROR:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Message:', error.message);
        }
    }
}

testMauricio(); 