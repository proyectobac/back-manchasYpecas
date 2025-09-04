require('dotenv').config();

const { sequelize } = require('./database/config');
const initModels = require('./src/models/initModels');

async function modificarCompraMauricio() {
    try {
        // Inicializar modelos
        initModels();

        console.log('🔍 CONSULTANDO Y MODIFICANDO COMPRA DE MAURICIO...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // 1. Consultar compras de Mauricio usando SQL directo
        const [comprasActuales] = await sequelize.query(`
            SELECT 
                v.id_venta, 
                v.total_venta, 
                v.estado_venta, 
                v.metodo_pago,
                v.referencia_pago,
                v.nombre_cliente,
                v.fecha_venta
            FROM ventas v 
            WHERE v.id_usuario = 4
            ORDER BY v.fecha_venta DESC
        `);

        if (comprasActuales.length === 0) {
            console.log('❌ Mauricio no tiene compras registradas');
            return;
        }

        console.log(`✅ Mauricio tiene ${comprasActuales.length} compra(s):`);
        comprasActuales.forEach((compra, index) => {
            console.log(`${index + 1}. ID: ${compra.id_venta} | $${compra.total_venta} | ${compra.estado_venta} | ${compra.metodo_pago}`);
        });

        // 2. Seleccionar primera compra para modificar
        const idVenta = comprasActuales[0].id_venta;
        console.log(`\n🔧 MODIFICANDO COMPRA ID: ${idVenta}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // 3. Eliminar detalles actuales
        await sequelize.query('DELETE FROM detalle_venta WHERE id_venta = ?', {
            replacements: [idVenta]
        });
        console.log('🗑️ Detalles anteriores eliminados');

        // 4. Insertar nuevo detalle con Anti pulgas (ID: 5) y precio 1667
        const nuevoPrecio = 1667;
        const cantidad = 1;
        const subtotal = nuevoPrecio * cantidad;

        await sequelize.query(`
            INSERT INTO detalle_venta 
            (id_venta, id_producto, cantidad, precio_unitario, subtotal_linea) 
            VALUES (?, ?, ?, ?, ?)
        `, {
            replacements: [idVenta, 5, cantidad, nuevoPrecio, subtotal]
        });

        console.log(`✅ Nuevo detalle creado: Anti pulgas - Cant: ${cantidad} - Precio: $${nuevoPrecio}`);

        // 5. Actualizar total de la venta
        await sequelize.query('UPDATE ventas SET total_venta = ? WHERE id_venta = ?', {
            replacements: [subtotal, idVenta]
        });

        console.log(`✅ Total de venta actualizado: $${subtotal}`);

        // 6. Verificar los cambios
        console.log(`\n🔍 VERIFICACIÓN DE CAMBIOS`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const [ventaActualizada] = await sequelize.query(`
            SELECT 
                v.id_venta, 
                v.total_venta, 
                v.estado_venta, 
                v.metodo_pago,
                v.referencia_pago,
                v.nombre_cliente,
                v.fecha_venta,
                p.nombre as producto_nombre
            FROM ventas v 
            LEFT JOIN detalle_venta dv ON v.id_venta = dv.id_venta
            LEFT JOIN productos p ON dv.id_producto = p.id_producto
            WHERE v.id_venta = ?
        `, {
            replacements: [idVenta]
        });

        if (ventaActualizada.length > 0) {
            const venta = ventaActualizada[0];
            console.log(`📋 Venta ID: ${venta.id_venta}`);
            console.log(`👤 Cliente: ${venta.nombre_cliente}`);
            console.log(`🛍️ Producto: ${venta.producto_nombre}`);
            console.log(`💰 Total: $${venta.total_venta}`);
            console.log(`📊 Estado: ${venta.estado_venta}`);
            console.log(`💳 Método: ${venta.metodo_pago}`);
            console.log(`📅 Fecha: ${venta.fecha_venta}`);
        }

        console.log(`\n✅ MODIFICACIÓN COMPLETADA!`);
        console.log('🎯 Mauricio ahora verá en "Mis Compras" una compra de Anti pulgas por $1,667');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

modificarCompraMauricio(); 