const { sequelize } = require('../database/config');

const verificarComprasCliente = async () => {
    try {
        console.log('🔍 VERIFICANDO COMPRAS EN LA BASE DE DATOS');
        console.log('══════════════════════════════════════════════════');

        // 1. Verificar usuarios con consulta SQL directa
        console.log('\n👥 USUARIOS EN LA BASE DE DATOS:');
        const [usuarios] = await sequelize.query(`
            SELECT u.id_usuario, u.nombre_usuario, u.correo, r.nombre as rol_nombre
            FROM usuarios u 
            LEFT JOIN roles r ON u.id_rol = r.id_rol
            ORDER BY u.id_usuario
        `);
        
        if (usuarios.length === 0) {
            console.log('  ❌ NO HAY USUARIOS EN LA BASE DE DATOS');
        } else {
            usuarios.forEach(usuario => {
                console.log(`  - ID: ${usuario.id_usuario}, Usuario: ${usuario.nombre_usuario}, Email: ${usuario.correo}, Rol: ${usuario.rol_nombre || 'Sin rol'}`);
            });
        }

        // 2. Verificar ventas totales
        console.log('\n💰 VENTAS TOTALES EN LA BASE DE DATOS:');
        const [ventas] = await sequelize.query(`
            SELECT id_venta, id_usuario, total_venta, estado_venta, fecha_venta, nombre_cliente
            FROM ventas 
            ORDER BY fecha_venta DESC
        `);

        if (ventas.length === 0) {
            console.log('  ❌ NO HAY VENTAS EN LA BASE DE DATOS');
        } else {
            console.log(`  ✅ Total de ventas: ${ventas.length}`);
            ventas.forEach(venta => {
                console.log(`  - Venta ID: ${venta.id_venta}, Usuario ID: ${venta.id_usuario || 'NULL'}, Cliente: ${venta.nombre_cliente}, Total: $${venta.total_venta}, Estado: ${venta.estado_venta}, Fecha: ${venta.fecha_venta}`);
            });
        }

        // 3. Verificar ventas por usuario con rol cliente
        console.log('\n🛒 VENTAS POR USUARIO CON ROL CLIENTE:');
        const [clientesConVentas] = await sequelize.query(`
            SELECT 
                u.id_usuario, 
                u.nombre_usuario, 
                u.correo,
                r.nombre as rol_nombre,
                COUNT(v.id_venta) as total_compras,
                COALESCE(SUM(v.total_venta), 0) as total_gastado
            FROM usuarios u 
            LEFT JOIN roles r ON u.id_rol = r.id_rol
            LEFT JOIN ventas v ON u.id_usuario = v.id_usuario
            WHERE LOWER(r.nombre) = 'cliente'
            GROUP BY u.id_usuario, u.nombre_usuario, u.correo, r.nombre
            ORDER BY total_compras DESC
        `);

        if (clientesConVentas.length === 0) {
            console.log('  ❌ NO HAY USUARIOS CON ROL CLIENTE');
        } else {
            clientesConVentas.forEach(cliente => {
                console.log(`  - Cliente: ${cliente.nombre_usuario} (ID: ${cliente.id_usuario})`);
                console.log(`    Email: ${cliente.correo}`);
                console.log(`    Compras: ${cliente.total_compras}`);
                console.log(`    Total gastado: $${cliente.total_gastado}`);
                console.log('');
            });
        }

        // 4. Verificar estructura de la tabla ventas
        console.log('\n🏗️ ESTRUCTURA DE LA TABLA VENTAS:');
        const [columns] = await sequelize.query('DESCRIBE ventas');
        console.log('  Columnas importantes:');
        columns.forEach(col => {
            if (['id_venta', 'id_usuario', 'total_venta', 'estado_venta', 'nombre_cliente'].includes(col.Field)) {
                console.log(`    - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${col.Key ? `[${col.Key}]` : ''}`);
            }
        });

        // 5. Verificar ventas específicas con detalles
        console.log('\n📦 DETALLE DE VENTAS:');
        const [ventasDetalle] = await sequelize.query(`
            SELECT 
                v.id_venta,
                v.id_usuario,
                v.nombre_cliente,
                v.total_venta,
                v.estado_venta,
                v.fecha_venta,
                COUNT(dv.id_detalle_venta) as cantidad_productos
            FROM ventas v
            LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
            GROUP BY v.id_venta
            ORDER BY v.fecha_venta DESC
            LIMIT 5
        `);

        if (ventasDetalle.length === 0) {
            console.log('  ❌ NO HAY VENTAS CON DETALLES');
        } else {
            ventasDetalle.forEach(venta => {
                console.log(`  - Venta ${venta.id_venta}: ${venta.nombre_cliente}, $${venta.total_venta}, ${venta.cantidad_productos} productos, Usuario ID: ${venta.id_usuario || 'NULL'}`);
            });
        }

    } catch (error) {
        console.error('❌ Error al verificar compras:', error.message);
    } finally {
        await sequelize.close();
        console.log('\n🔚 Verificación completada');
    }
};

verificarComprasCliente(); 