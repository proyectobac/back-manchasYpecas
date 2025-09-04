// scripts/verificarCompras.js
require('dotenv').config();

const { sequelize } = require('../database/config');
const Usuario = require('../src/models/usuarios/usuariosModel');
const Ventas = require('../src/models/ventas/ventasModel');
const DetalleVenta = require('../src/models/detalleVentas/detalleVentasModel');
const Producto = require('../src/models/productos/productosModel');
const initModels = require('../src/models/initModels');

async function verificarComprasUsuario(nombreUsuario = 'cristian') {
    console.log(`🔍 Verificando compras del usuario: ${nombreUsuario}`);
    console.log('━'.repeat(50));
    
    try {
        // Inicializar modelos
        initModels();

        // Buscar usuario
        const usuario = await Usuario.findOne({
            where: { nombre_usuario: nombreUsuario }
        });

        if (!usuario) {
            console.log(`❌ Usuario ${nombreUsuario} no encontrado`);
            return;
        }

        console.log(`✅ Usuario encontrado: ${usuario.nombre_usuario} (ID: ${usuario.id_usuario})`);

        // Buscar ventas del usuario
        const ventas = await Ventas.findAll({
            where: { id_usuario: usuario.id_usuario },
            include: [
                {
                    model: DetalleVenta,
                    as: 'detalles',
                    include: [
                        {
                            model: Producto,
                            as: 'producto',
                            attributes: ['nombre', 'descripcion']
                        }
                    ]
                }
            ],
            order: [['fecha_venta', 'DESC']]
        });

        console.log(`\n📋 Compras encontradas: ${ventas.length}`);
        
        if (ventas.length === 0) {
            console.log('   No hay compras registradas para este usuario');
            return;
        }

        ventas.forEach((venta, index) => {
            console.log(`\n${index + 1}. VENTA #${venta.id_venta}`);
            console.log(`   Referencia: ${venta.numero_referencia || 'Sin referencia'}`);
            console.log(`   Total: $${venta.total_venta}`);
            console.log(`   Estado: ${venta.estado_venta}`);
            console.log(`   Fecha: ${venta.fecha_venta}`);
            console.log(`   Cliente: ${venta.nombre_cliente}`);
            console.log(`   Método de pago: ${venta.metodo_pago}`);
            
            if (venta.detalles && venta.detalles.length > 0) {
                console.log('   Productos:');
                venta.detalles.forEach(detalle => {
                    console.log(`      - ${detalle.producto?.nombre || 'Producto sin nombre'}`);
                    console.log(`        Cantidad: ${detalle.cantidad}`);
                    console.log(`        Precio unitario: $${detalle.precio_unitario}`);
                    console.log(`        Subtotal: $${detalle.subtotal_linea}`);
                });
            }
        });

        // Estadísticas
        const totalCompras = ventas.length;
        const totalGastado = ventas.reduce((sum, venta) => sum + parseFloat(venta.total_venta), 0);
        const comprasCompletadas = ventas.filter(v => v.estado_venta === 'Completada').length;

        console.log('\n📊 ESTADÍSTICAS:');
        console.log(`   Total de compras: ${totalCompras}`);
        console.log(`   Compras completadas: ${comprasCompletadas}`);
        console.log(`   Total gastado: $${totalGastado.toFixed(2)}`);

    } catch (error) {
        console.error('❌ Error al verificar compras:', error.message);
    }
}

async function main() {
    try {
        await verificarComprasUsuario('cristian');
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

module.exports = { verificarComprasUsuario }; 