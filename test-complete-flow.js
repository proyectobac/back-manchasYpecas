const axios = require('axios');

async function testCompleteFlow() {
    console.log('🧪 PRUEBA COMPLETA DEL FLUJO FRONTEND');
    console.log('════════════════════════════════════════');
    
    const API_BASE_URL = 'http://localhost:3000'; // Mismo que .env del frontend
    
    try {
        // 1. LOGIN
        console.log('🔐 1. HACIENDO LOGIN...');
        const loginResponse = await axios.post(`${API_BASE_URL}/api/login`, {
            nombre_usuario: 'ClienteTest',
            contrasena: '12345678'
        });

        console.log('✅ Login exitoso');
        console.log('👤 Usuario:', loginResponse.data.usuario.nombre_usuario);
        console.log('🎭 Rol:', loginResponse.data.usuario.rol.nombre);

        const token = loginResponse.data.token;

        // 2. LLAMADA MIS COMPRAS (exacta como clienteComprasService.js)
        console.log('\\n🛒 2. LLAMANDO MIS COMPRAS...');
        const comprasResponse = await axios.get(`${API_BASE_URL}/api/ventas/cliente/mis-compras`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Respuesta recibida');
        console.log('📊 Status HTTP:', comprasResponse.status);
        
        // 3. PROCESAMIENTO COMO EN EL FRONTEND
        console.log('\\n🔄 3. PROCESANDO COMO CLIENTECOMPRASSERVICE...');
        
        const result = {
            success: true,
            compras: comprasResponse.data.ventas || comprasResponse.data.compras || [],
            total: comprasResponse.data.total || 0
        };

        console.log('📦 Resultado procesado:');
        console.log('   ✅ Success:', result.success);
        console.log('   📈 Total:', result.total);
        console.log('   📋 Compras array length:', result.compras.length);

        // 4. DATOS COMO LOS VERÍA EL USUARIO
        console.log('\\n👀 4. LO QUE VERÍA EL USUARIO EN EL FRONTEND:');
        if (result.compras.length > 0) {
            console.log(`🎉 ¡ÉXITO! Se mostrarían ${result.compras.length} compra(s):`);
            result.compras.forEach((compra, index) => {
                console.log(`\\n   📦 Compra ${index + 1}:`);
                console.log(`      🆔 ID: ${compra.id_venta}`);
                console.log(`      📅 Fecha: ${compra.fecha_venta}`);
                console.log(`      💰 Total: $${compra.total_venta}`);
                console.log(`      👤 Cliente: ${compra.nombre_cliente}`);
                console.log(`      📊 Estado: ${compra.estado_venta}`);
            });
        } else {
            console.log('📭 Se mostraría: "No hay compras registradas"');
        }

        // 5. DATOS RAW PARA DEBUG
        console.log('\\n🔍 5. DATOS RAW DEL BACKEND:');
        console.log(JSON.stringify(comprasResponse.data, null, 2));

        console.log('\\n🎯 CONCLUSIÓN:');
        if (result.compras.length > 0) {
            console.log('✅ ¡TODO FUNCIONA CORRECTAMENTE!');
            console.log('   El frontend debería mostrar las compras sin problemas');
        } else {
            console.log('❌ No hay compras para mostrar');
            console.log('   Verificar que el usuario tenga ventas asignadas');
        }

    } catch (error) {
        console.error('\\n❌ ERROR EN EL FLUJO:');
        if (error.response) {
            console.error('🔴 Status:', error.response.status);
            console.error('🔴 Datos:', error.response.data);
        } else {
            console.error('🔴 Error:', error.message);
        }
        
        console.log('\\n🔍 DIAGNÓSTICO:');
        if (error.response?.status === 401) {
            console.log('   🔑 Problema de autenticación - revisar credenciales');
        } else if (error.response?.status === 500) {
            console.log('   🚨 Error del servidor - revisar logs del backend');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('   🔌 Backend no está corriendo en puerto 3000');
        }
    }
}

testCompleteFlow(); 