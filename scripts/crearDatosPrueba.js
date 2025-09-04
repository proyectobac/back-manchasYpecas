require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Datos de prueba para crear una venta
const datosVentaPrueba = {
    cliente: {
        nombreCompleto: "ClienteTest Prueba",
        telefono: "3001234567",
        direccion: "Calle 123 # 45-67",
        ciudad: "Bogotá",
        notasAdicionales: "Venta de prueba generada automáticamente"
    },
    items: [
        {
            id_producto: 1, // Se actualizará con producto real
            cantidad: 2,
            precioUnitario: 15000
        },
        {
            id_producto: 2, // Se actualizará con producto real
            cantidad: 1,
            precioUnitario: 25000
        }
    ],
    metodo_pago: "EFECTIVO",
    referencia_pago: `PRUEBA-${Date.now()}`
};

// Función para hacer login y obtener token
async function obtenerToken(usuario, contrasena) {
    try {
        console.log(`🔑 Intentando login con usuario: ${usuario}`);
        
        const response = await axios.post(`${API_BASE_URL}/api/login`, {
            nombre_usuario: usuario,
            contrasena: contrasena
        });

        if (response.data && response.data.token) {
            console.log(`✅ Login exitoso para: ${usuario}`);
            return response.data.token;
        } else {
            throw new Error('No se recibió token en la respuesta');
        }
    } catch (error) {
        console.error(`❌ Error en login para ${usuario}:`, error.response?.data || error.message);
        return null;
    }
}

// Función para obtener productos disponibles
async function obtenerProductos(token) {
    try {
        console.log('📦 Obteniendo productos disponibles...');
        
        const response = await axios.get(`${API_BASE_URL}/api/productos/producto`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.data && response.data.productos) {
            const productosActivos = response.data.productos.filter(p => 
                p.estado === 'Activo' && p.stock > 0 && p.precioVenta > 0
            );
            
            console.log(`✅ Encontrados ${productosActivos.length} productos disponibles`);
            return productosActivos;
        }
        return [];
    } catch (error) {
        console.error('❌ Error al obtener productos:', error.response?.data || error.message);
        return [];
    }
}

// Función para crear una venta de prueba
async function crearVentaPrueba(token, productos) {
    try {
        console.log('🛒 Creando venta de prueba...');
        
        // Actualizar los items con productos reales
        if (productos.length >= 2) {
            datosVentaPrueba.items[0].id_producto = productos[0].id_producto;
            datosVentaPrueba.items[0].precioUnitario = productos[0].precioVenta;
            
            datosVentaPrueba.items[1].id_producto = productos[1].id_producto;
            datosVentaPrueba.items[1].precioUnitario = productos[1].precioVenta;
        } else if (productos.length === 1) {
            datosVentaPrueba.items = [{
                id_producto: productos[0].id_producto,
                cantidad: 1,
                precioUnitario: productos[0].precioVenta
            }];
        } else {
            throw new Error('No hay productos disponibles para crear la venta');
        }

        console.log('📝 Datos de la venta:', JSON.stringify(datosVentaPrueba, null, 2));

        const response = await axios.post(`${API_BASE_URL}/api/ventas/ven`, datosVentaPrueba, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.ok) {
            console.log('✅ Venta creada exitosamente:', response.data);
            return response.data.venta;
        } else {
            throw new Error(response.data?.msg || 'Error al crear la venta');
        }
    } catch (error) {
        console.error('❌ Error al crear venta:', error.response?.data || error.message);
        return null;
    }
}

// Función para verificar las compras del cliente
async function verificarComprasCliente(token) {
    try {
        console.log('📋 Verificando compras del cliente...');
        
        const response = await axios.get(`${API_BASE_URL}/api/ventas/cliente/mis-compras`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.data && response.data.ok) {
            console.log(`✅ Cliente tiene ${response.data.total} compras:`);
            response.data.ventas.forEach((venta, index) => {
                console.log(`   ${index + 1}. Ref: ${venta.numero_referencia} - Total: $${venta.total_venta} - Estado: ${venta.estado_venta}`);
            });
            return response.data.ventas;
        }
        return [];
    } catch (error) {
        console.error('❌ Error al verificar compras:', error.response?.data || error.message);
        return [];
    }
}

// Función principal
async function main() {
    console.log('🚀 Iniciando script de creación de datos de prueba...\n');

    // Lista de usuarios a probar
    const usuariosPrueba = [
        { usuario: 'ClienteTest', contrasena: '12345678S' },
        { usuario: 'Admin', contrasena: '12345678S' }
    ];

    let tokenCliente = null;
    let tokenAdmin = null;

    // Intentar login con cada usuario
    for (const { usuario, contrasena } of usuariosPrueba) {
        const token = await obtenerToken(usuario, contrasena);
        if (token) {
            if (usuario === 'ClienteTest') {
                tokenCliente = token;
            } else if (usuario === 'Admin') {
                tokenAdmin = token;
            }
        }
    }

    // Si no hay cliente, usar admin para crear la venta
    const tokenParaVenta = tokenCliente || tokenAdmin;
    
    if (!tokenParaVenta) {
        console.error('❌ No se pudo obtener token de ningún usuario');
        return;
    }

    console.log(`\n📍 Usando token de: ${tokenCliente ? 'ClienteTest' : 'Admin'}\n`);

    // Obtener productos disponibles
    const productos = await obtenerProductos(tokenParaVenta);
    
    if (productos.length === 0) {
        console.error('❌ No hay productos disponibles para crear la venta');
        return;
    }

    // Crear venta de prueba
    const ventaCreada = await crearVentaPrueba(tokenParaVenta, productos);
    
    if (!ventaCreada) {
        console.error('❌ No se pudo crear la venta de prueba');
        return;
    }

    // Si tenemos token de cliente, verificar sus compras
    if (tokenCliente) {
        console.log('\n🔍 Verificando compras del cliente...\n');
        await verificarComprasCliente(tokenCliente);
    }

    console.log('\n🎉 Script completado exitosamente!');
}

// Ejecutar script
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Error fatal en el script:', error);
        process.exit(1);
    });
}

module.exports = { main }; 