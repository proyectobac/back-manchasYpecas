// Simular exactamente lo que hace el frontend
const axios = require('axios');

// Simular las variables de entorno del frontend
const API_BASE_URL = 'http://localhost:3000'; // Valor del .env del frontend

async function testFrontendConnection() {
    console.log('🧪 SIMULANDO LLAMADAS DEL FRONTEND');
    console.log('═════════════════════════════════════');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    try {
        // 1. Simular el login del frontend
        console.log('\n🔐 1. SIMULANDO LOGIN DEL FRONTEND...');
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
        console.log('📄 Usuario:', loginResponse.data.usuario.nombre_usuario);
        console.log('🎭 Rol:', loginResponse.data.usuario.Rol.nombre);
        console.log('🔑 Token obtenido correctamente');

        // 2. Simular la llamada exacta que hace clienteComprasService.js
        console.log('\n🛒 2. SIMULANDO LLAMADA MIS COMPRAS...');
        console.log('URL completa:', `${API_BASE_URL}/api/ventas/cliente/mis-compras`);
        
        const comprasResponse = await axios.get(`${API_BASE_URL}/api/ventas/cliente/mis-compras`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Respuesta exitosa del backend');
        console.log('📊 Status:', comprasResponse.status);
        console.log('📋 Datos recibidos:', JSON.stringify(comprasResponse.data, null, 2));

        // 3. Simular el procesamiento que hace el frontend
        console.log('\n🔄 3. PROCESANDO COMO LO HARÍA EL FRONTEND...');
        
        const result = {
            success: true,
            compras: comprasResponse.data.ventas || comprasResponse.data.compras || [],
            total: comprasResponse.data.total || 0
        };

        console.log('📦 Resultado procesado:');
        console.log('   Success:', result.success);
        console.log('   Total compras:', result.total);
        console.log('   Compras encontradas:', result.compras.length);

        if (result.compras.length > 0) {
            console.log('\n📋 DETALLE DE COMPRAS COMO LAS VERÍA EL FRONTEND:');
            result.compras.forEach((compra, index) => {
                console.log(`   ${index + 1}. Compra #${compra.id_venta}`);
                console.log(`      Fecha: ${compra.fecha_venta}`);
                console.log(`      Total: $${compra.total_venta}`);
                console.log(`      Cliente: ${compra.nombre_cliente}`);
                console.log(`      Estado: ${compra.estado_venta}`);
            });
        } else {
            console.log('   📭 Frontend mostraría: "No hay compras registradas"');
        }

        // 4. Verificar si hay problemas de formato
        console.log('\n🔍 4. VERIFICANDO FORMATO DE DATOS...');
        if (comprasResponse.data.ok !== undefined) {
            console.log('✅ Formato de respuesta correcto (.ok presente)');
        } else {
            console.log('⚠️  Formato podría causar problemas (sin .ok)');
        }

        if (comprasResponse.data.ventas) {
            console.log('✅ Propiedad "ventas" presente');
        } else if (comprasResponse.data.compras) {
            console.log('✅ Propiedad "compras" presente');
        } else {
            console.log('❌ No se encontró "ventas" ni "compras" en la respuesta');
        }

    } catch (error) {
        console.error('\n❌ ERROR EN LA SIMULACIÓN:');
        console.error('Tipo de error:', error.name);
        console.error('Mensaje:', error.message);
        
        if (error.response) {
            console.error('Status HTTP:', error.response.status);
            console.error('Datos del error:', error.response.data);
        } else if (error.request) {
            console.error('No se recibió respuesta del servidor');
            console.error('Request config:', error.config);
        }
        
        console.error('\n🔍 DIAGNÓSTICO:');
        if (error.code === 'ECONNREFUSED') {
            console.error('   🔴 Backend no está corriendo en puerto 3000');
        } else if (error.response?.status === 401) {
            console.error('   🔴 Problema de autenticación');
        } else if (error.response?.status === 404) {
            console.error('   🔴 Endpoint no encontrado');
        } else {
            console.error('   🔴 Error desconocido');
        }
    }
}

// Ejecutar test
console.log('🚀 Iniciando prueba de conexión frontend-backend...');
testFrontendConnection(); 