const { sequelize } = require('../database/config');

const crearVentaPruebaCliente = async () => {
    const transaction = await sequelize.transaction();
    
    try {
        console.log('🛒 CREANDO VENTA DE PRUEBA PARA CLIENTE');
        console.log('═══════════════════════════════════════════════');

        // 1. Verificar que el usuario Cristian (Cliente) existe
        const [usuarios] = await sequelize.query(`
            SELECT u.id_usuario, u.nombre_usuario, r.nombre as rol_nombre
            FROM usuarios u 
            LEFT JOIN roles r ON u.id_rol = r.id_rol
            WHERE LOWER(r.nombre) = 'cliente'
            LIMIT 1
        `, { transaction });

        if (usuarios.length === 0) {
            throw new Error('No hay usuarios con rol Cliente');
        }

        const cliente = usuarios[0];
        console.log(`👤 Cliente encontrado: ${cliente.nombre_usuario} (ID: ${cliente.id_usuario})`);

        // 2. Verificar que hay productos disponibles
        const [productos] = await sequelize.query(`
            SELECT id_producto, nombre, precioCosto as precio_venta, stock 
            FROM productos 
            WHERE estado = 'Activo' AND stock > 0
            LIMIT 3
        `, { transaction });

        if (productos.length === 0) {
            throw new Error('No hay productos disponibles');
        }

        console.log(`📦 Productos disponibles: ${productos.length}`);
        productos.forEach(p => {
            console.log(`  - ${p.nombre}: $${p.precio_venta} (Stock: ${p.stock})`);
        });

        // 3. Crear la venta
        const totalVenta = productos.reduce((sum, p) => sum + parseFloat(p.precio_venta), 0);
        
        const [resultVenta] = await sequelize.query(`
            INSERT INTO ventas (
                id_usuario, 
                total_venta, 
                estado_venta, 
                metodo_pago,
                nombre_cliente, 
                telefono_cliente, 
                direccion_cliente, 
                ciudad_cliente,
                fecha_venta
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, {
            replacements: [
                cliente.id_usuario,
                totalVenta,
                'Completada',
                'PSE',
                'Cristian Cliente',
                '3001234567',
                'Calle 123 #45-67',
                'Bogotá'
            ],
            transaction
        });

        const idVenta = resultVenta;
        console.log(`✅ Venta creada con ID: ${idVenta}`);

        // 4. Crear detalles de venta
        let detalleCreados = 0;
        for (let i = 0; i < Math.min(productos.length, 2); i++) {
            const producto = productos[i];
            const cantidad = 1;
            const precioUnitario = parseFloat(producto.precio_venta);
            const subtotal = cantidad * precioUnitario;

            await sequelize.query(`
                INSERT INTO detalle_venta (
                    id_venta, 
                    id_producto, 
                    cantidad, 
                    precio_unitario, 
                    subtotal_linea
                ) VALUES (?, ?, ?, ?, ?)
            `, {
                replacements: [idVenta, producto.id_producto, cantidad, precioUnitario, subtotal],
                transaction
            });

            // Actualizar stock
            await sequelize.query(`
                UPDATE productos 
                SET stock = stock - ? 
                WHERE id_producto = ?
            `, {
                replacements: [cantidad, producto.id_producto],
                transaction
            });

            detalleCreados++;
            console.log(`  📦 Detalle ${detalleCreados}: ${producto.nombre} x${cantidad} = $${subtotal}`);
        }

        // 5. Confirmar transacción
        await transaction.commit();

        console.log(`\n🎉 VENTA DE PRUEBA CREADA EXITOSAMENTE`);
        console.log(`   ID Venta: ${idVenta}`);
        console.log(`   Cliente: ${cliente.nombre_usuario} (ID: ${cliente.id_usuario})`);
        console.log(`   Total: $${totalVenta}`);
        console.log(`   Productos: ${detalleCreados}`);
        console.log(`   Estado: Completada`);

        // 6. Verificar que se creó correctamente
        const [ventaCreada] = await sequelize.query(`
            SELECT v.*, COUNT(dv.id_detalle_venta) as cantidad_productos
            FROM ventas v
            LEFT JOIN detalle_venta dv ON v.id_venta = dv.id_venta
            WHERE v.id_venta = ?
            GROUP BY v.id_venta
        `, { replacements: [idVenta] });

        if (ventaCreada.length > 0) {
            const venta = ventaCreada[0];
            console.log(`\n✅ VERIFICACIÓN:`);
            console.log(`   Venta ID: ${venta.id_venta}`);
            console.log(`   Usuario ID: ${venta.id_usuario}`);
            console.log(`   Total: $${venta.total_venta}`);
            console.log(`   Productos: ${venta.cantidad_productos}`);
            console.log(`   Fecha: ${venta.fecha_venta}`);
        }

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Error al crear venta de prueba:', error.message);
    } finally {
        await sequelize.close();
        console.log('\n🔚 Proceso completado');
    }
};

crearVentaPruebaCliente(); 