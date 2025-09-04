const { sequelize } = require('../src/models/ventas/ventasModel');

async function corregirVentasCristian() {
  try {
    console.log('🔧 CORRIGIENDO VENTAS DE CRISTIAN');
    console.log('════════════════════════════════════════════════════════════');
    
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos exitosa.');

    // Buscar el usuario cristian
    const [usuarios] = await sequelize.query(`
      SELECT id_usuario, nombre_usuario FROM usuarios WHERE nombre_usuario = 'cristian'
    `);

    if (usuarios.length === 0) {
      console.log('❌ Usuario cristian no encontrado');
      return;
    }

    const cristian = usuarios[0];
    console.log(`✅ Usuario encontrado: ${cristian.nombre_usuario} (ID: ${cristian.id_usuario})`);

    // Buscar ventas sin id_usuario
    const [ventasSinUsuario] = await sequelize.query(`
      SELECT 
        id_venta, 
        total_venta, 
        nombre_cliente,
        fecha_venta,
        estado_venta
      FROM ventas 
      WHERE id_usuario IS NULL
    `);

    console.log(`\n📋 Ventas sin usuario encontradas: ${ventasSinUsuario.length}`);

    if (ventasSinUsuario.length === 0) {
      console.log('✅ No hay ventas sin usuario para corregir');
      return;
    }

    // Mostrar las ventas sin usuario
    ventasSinUsuario.forEach((venta, index) => {
      console.log(`${index + 1}. VENTA #${venta.id_venta}`);
      console.log(`   Total: $${parseFloat(venta.total_venta).toLocaleString('es-CO')}`);
      console.log(`   Cliente: ${venta.nombre_cliente || 'Sin nombre'}`);
      console.log(`   Fecha: ${venta.fecha_venta}`);
      console.log(`   Estado: ${venta.estado_venta}`);
      console.log('');
    });

    // Actualizar las ventas para asociarlas a cristian
    for (const venta of ventasSinUsuario) {
      await sequelize.query(`
        UPDATE ventas 
        SET 
          id_usuario = :id_usuario,
          nombre_cliente = CASE 
            WHEN nombre_cliente IS NULL OR nombre_cliente = '' 
            THEN 'cristian Cliente' 
            ELSE nombre_cliente 
          END
        WHERE id_venta = :id_venta
      `, {
        replacements: {
          id_usuario: cristian.id_usuario,
          id_venta: venta.id_venta
        }
      });

      console.log(`✅ Venta #${venta.id_venta} asociada al usuario cristian`);
    }

    // Verificar el resultado
    console.log('\n🔍 VERIFICANDO RESULTADO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const [ventasCristian] = await sequelize.query(`
      SELECT 
        id_venta,
        total_venta,
        nombre_cliente,
        fecha_venta,
        estado_venta,
        metodo_pago
      FROM ventas 
      WHERE id_usuario = :id_usuario
      ORDER BY fecha_venta DESC
    `, {
      replacements: { id_usuario: cristian.id_usuario }
    });

    console.log(`📊 Total de compras de cristian: ${ventasCristian.length}`);
    
    let totalGastado = 0;
    ventasCristian.forEach((venta, index) => {
      const total = parseFloat(venta.total_venta);
      totalGastado += total;
      
      console.log(`${index + 1}. VENTA #${venta.id_venta}`);
      console.log(`   Total: $${total.toLocaleString('es-CO')}`);
      console.log(`   Cliente: ${venta.nombre_cliente}`);
      console.log(`   Estado: ${venta.estado_venta}`);
      console.log(`   Fecha: ${new Date(venta.fecha_venta).toLocaleDateString('es-CO')}`);
      console.log(`   Método: ${venta.metodo_pago || 'N/A'}`);
      console.log('');
    });

    console.log(`💰 Total gastado por cristian: $${totalGastado.toLocaleString('es-CO')}`);
    console.log('✅ Corrección completada exitosamente');

  } catch (error) {
    console.error('❌ Error al corregir ventas:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

corregirVentasCristian(); 