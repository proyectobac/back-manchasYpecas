const mysql = require('mysql2/promise');

async function modificarCompraMauricio() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin123',
    database: 'manchasypecas_db'
  });

  try {
    console.log('🔍 CONSULTANDO COMPRAS DE MAURICIO (ID: 4)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 1. Consultar compras actuales de Mauricio
    const [comprasActuales] = await connection.execute(`
      SELECT 
        v.id_venta, 
        v.total_venta, 
        v.estado_venta, 
        v.metodo_pago,
        v.referencia_pago,
        v.nombre_cliente,
        v.fecha_venta,
        COUNT(dv.id_detalle_venta) as num_productos
      FROM ventas v 
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.id_usuario = 4
      GROUP BY v.id_venta
      ORDER BY v.fecha_venta DESC
    `);

    if (comprasActuales.length === 0) {
      console.log('❌ Mauricio no tiene compras registradas');
      await connection.end();
      return;
    }

    console.log(`✅ Mauricio tiene ${comprasActuales.length} compra(s):`);
    comprasActuales.forEach((compra, index) => {
      console.log(`${index + 1}. ID: ${compra.id_venta} | $${compra.total_venta} | ${compra.estado_venta} | ${compra.metodo_pago} | ${compra.num_productos} productos`);
    });

    // 2. Seleccionar la primera compra para modificar
    const compraAModificar = comprasActuales[0];
    const idVenta = compraAModificar.id_venta;

    console.log(`\n🔧 MODIFICANDO COMPRA ID: ${idVenta}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 3. Verificar que existe el producto 'Anti pulgas' (ID: 5)
    const [antiPulgas] = await connection.execute(
      'SELECT id_producto, nombre, precioVenta FROM productos WHERE id_producto = 5'
    );

    if (antiPulgas.length === 0) {
      console.log('❌ Producto Anti pulgas no encontrado');
      await connection.end();
      return;
    }

    console.log(`✅ Producto encontrado: ${antiPulgas[0].nombre} (ID: ${antiPulgas[0].id_producto})`);

    // 4. Eliminar detalles actuales de la venta
    await connection.execute(
      'DELETE FROM detalle_ventas WHERE id_venta = ?',
      [idVenta]
    );

    console.log('🗑️ Detalles anteriores eliminados');

    // 5. Crear nuevo detalle con Anti pulgas y precio 1.667
    const nuevoPrecio = 1667; // 1.667 en pesos
    const cantidad = 1;
    const subtotal = nuevoPrecio * cantidad;

    await connection.execute(`
      INSERT INTO detalle_ventas 
      (id_venta, id_producto, cantidad, precio_unitario, subtotal_linea) 
      VALUES (?, ?, ?, ?, ?)
    `, [idVenta, 5, cantidad, nuevoPrecio, subtotal]);

    console.log(`✅ Nuevo detalle creado: Anti pulgas - Cant: ${cantidad} - Precio: $${nuevoPrecio}`);

    // 6. Actualizar el total de la venta
    await connection.execute(
      'UPDATE ventas SET total_venta = ? WHERE id_venta = ?',
      [subtotal, idVenta]
    );

    console.log(`✅ Total de venta actualizado: $${subtotal}`);

    // 7. Verificar los cambios
    console.log(`\n🔍 VERIFICACIÓN DE CAMBIOS`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const [ventaActualizada] = await connection.execute(`
      SELECT 
        v.id_venta, 
        v.total_venta, 
        v.estado_venta, 
        v.metodo_pago,
        v.referencia_pago,
        v.nombre_cliente,
        v.fecha_venta
      FROM ventas v 
      WHERE v.id_venta = ?
    `, [idVenta]);

    const [detallesActualizados] = await connection.execute(`
      SELECT 
        dv.*, 
        p.nombre as nombre_producto
      FROM detalle_ventas dv
      LEFT JOIN productos p ON dv.id_producto = p.id_producto
      WHERE dv.id_venta = ?
    `, [idVenta]);

    if (ventaActualizada.length > 0) {
      const venta = ventaActualizada[0];
      console.log(`📋 Venta ID: ${venta.id_venta}`);
      console.log(`👤 Cliente: ${venta.nombre_cliente}`);
      console.log(`💰 Total: $${venta.total_venta}`);
      console.log(`📊 Estado: ${venta.estado_venta}`);
      console.log(`💳 Método: ${venta.metodo_pago}`);
      console.log(`📅 Fecha: ${venta.fecha_venta}`);
    }

    console.log(`\n📦 Productos en la venta:`);
    detallesActualizados.forEach((detalle, index) => {
      console.log(`${index + 1}. ${detalle.nombre_producto} - Cant: ${detalle.cantidad} - Precio: $${detalle.precio_unitario} - Subtotal: $${detalle.subtotal_linea}`);
    });

    console.log(`\n✅ MODIFICACIÓN COMPLETADA!`);
    console.log('🎯 Mauricio ahora verá en "Mis Compras" una compra de Anti pulgas por $1,667');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

modificarCompraMauricio(); 