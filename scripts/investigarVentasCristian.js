require('dotenv').config();

const { sequelize } = require('../database/config');

async function investigarVentasCristian() {
    console.log('🕵️ INVESTIGACIÓN DE VENTAS DE CRISTIAN');
    console.log('═'.repeat(60));
    
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos exitosa.\n');

        // 1. Información del usuario Cristian
        console.log('👤 INFORMACIÓN DEL USUARIO:');
        console.log('─'.repeat(40));
        const [usuarios] = await sequelize.query(`
            SELECT 
                id_usuario, 
                nombre_usuario, 
                correo,
                telefono,
                created_at 
            FROM usuarios 
            WHERE nombre_usuario = 'cristian'
        `);

        if (usuarios.length === 0) {
            console.log('❌ Usuario cristian no encontrado');
            return;
        }

        const cristian = usuarios[0];
        console.log(`ID: ${cristian.id_usuario}`);
        console.log(`Usuario: ${cristian.nombre_usuario}`);
        console.log(`Email: ${cristian.correo}`);
        console.log(`Teléfono: ${cristian.telefono}`);
        console.log(`Creado: ${cristian.created_at}\n`);

        // 2. Todas las ventas del sistema con información detallada
        console.log('🔍 TODAS LAS VENTAS DEL SISTEMA:');
        console.log('─'.repeat(40));
        const [todasVentas] = await sequelize.query(`
            SELECT 
                v.id_venta,
                v.id_usuario,
                v.total_venta,
                v.nombre_cliente,
                v.telefono_cliente,
                v.fecha_venta,
                v.estado_venta,
                v.metodo_pago,
                v.created_at,
                u.nombre_usuario
            FROM ventas v
            LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
            ORDER BY v.created_at ASC
        `);

        console.log(`Total de ventas en el sistema: ${todasVentas.length}\n`);

        todasVentas.forEach((venta, index) => {
            console.log(`${index + 1}. VENTA #${venta.id_venta}`);
            console.log(`   Usuario ID: ${venta.id_usuario || 'NULL'}`);
            console.log(`   Usuario Nombre: ${venta.nombre_usuario || 'Sin usuario'}`);
            console.log(`   Cliente: ${venta.nombre_cliente}`);
            console.log(`   Teléfono Cliente: ${venta.telefono_cliente || 'N/A'}`);
            console.log(`   Total: $${parseFloat(venta.total_venta).toLocaleString('es-CO')}`);
            console.log(`   Fecha Venta: ${venta.fecha_venta}`);
            console.log(`   Creado en DB: ${venta.created_at}`);
            console.log(`   Estado: ${venta.estado_venta}`);
            console.log(`   Método Pago: ${venta.metodo_pago}\n`);
        });

        // 3. Ventas específicamente asignadas a Cristian
        console.log('👤 VENTAS ASIGNADAS A CRISTIAN:');
        console.log('─'.repeat(40));
        const [ventasCristian] = await sequelize.query(`
            SELECT 
                v.id_venta,
                v.total_venta,
                v.nombre_cliente,
                v.telefono_cliente,
                v.fecha_venta,
                v.created_at,
                v.estado_venta,
                v.metodo_pago
            FROM ventas v
            WHERE v.id_usuario = :id_usuario
            ORDER BY v.created_at ASC
        `, {
            replacements: { id_usuario: cristian.id_usuario }
        });

        console.log(`Cristian tiene asignadas: ${ventasCristian.length} ventas\n`);

        // 4. Análisis de coincidencias de datos
        console.log('🔍 ANÁLISIS DE AUTENTICIDAD:');
        console.log('─'.repeat(40));
        
        ventasCristian.forEach((venta, index) => {
            console.log(`VENTA #${venta.id_venta}:`);
            
            // Verificar si el teléfono del cliente coincide con el teléfono de Cristian
            const telefonoCoincide = venta.telefono_cliente === cristian.telefono;
            console.log(`   ✓ Teléfono Cliente: ${venta.telefono_cliente}`);
            console.log(`   ✓ Teléfono Cristian: ${cristian.telefono}`);
            console.log(`   ${telefonoCoincide ? '✅' : '❌'} Teléfonos coinciden: ${telefonoCoincide}`);
            
            // Verificar si el nombre del cliente sugiere que es Cristian
            const nombreSugiereCristian = venta.nombre_cliente?.toLowerCase().includes('cristian');
            console.log(`   ${nombreSugiereCristian ? '✅' : '❌'} Nombre sugiere Cristian: ${nombreSugiereCristian}`);
            
            // Verificar fechas
            const fechaVenta = new Date(venta.fecha_venta);
            const fechaCreacion = new Date(venta.created_at);
            const fechaCristian = new Date(cristian.created_at);
            
            const ventaDespuesDeUsuario = fechaVenta >= fechaCristian;
            console.log(`   ${ventaDespuesDeUsuario ? '✅' : '⚠️'} Venta después de crear usuario: ${ventaDespuesDeUsuario}`);
            
            console.log(`   📅 Fecha venta: ${fechaVenta.toLocaleString('es-CO')}`);
            console.log(`   📅 Usuario creado: ${fechaCristian.toLocaleString('es-CO')}\n`);
        });

        // 5. Verificar si había ventas sin usuario antes
        console.log('🔍 HISTÓRICO DE VENTAS SIN USUARIO:');
        console.log('─'.repeat(40));
        const [ventasSinUsuario] = await sequelize.query(`
            SELECT COUNT(*) as total
            FROM ventas 
            WHERE id_usuario IS NULL
        `);

        console.log(`Ventas actuales sin usuario: ${ventasSinUsuario[0].total}`);

        // 6. Resumen y recomendaciones
        console.log('\n📊 RESUMEN Y RECOMENDACIONES:');
        console.log('═'.repeat(60));
        
        const telefonosCoinciden = ventasCristian.every(v => v.telefono_cliente === cristian.telefono);
        const nombresCoinciden = ventasCristian.every(v => v.nombre_cliente?.toLowerCase().includes('cristian'));
        
        console.log(`✓ Total ventas de Cristian: ${ventasCristian.length}`);
        console.log(`✓ Todos los teléfonos coinciden: ${telefonosCoinciden ? 'SÍ' : 'NO'}`);
        console.log(`✓ Todos los nombres sugieren Cristian: ${nombresCoinciden ? 'SÍ' : 'NO'}`);
        
        if (telefonosCoinciden && nombresCoinciden) {
            console.log('\n✅ VEREDICTO: Las ventas parecen legítimas de Cristian');
        } else {
            console.log('\n⚠️ VEREDICTO: POSIBLE PROBLEMA - Las ventas podrían no ser de Cristian');
            console.log('   Recomendación: Revisar manualmente la autenticidad de las ventas');
        }

    } catch (error) {
        console.error('❌ Error en la investigación:', error.message);
    } finally {
        await sequelize.close();
        console.log('\n🔚 Investigación completada');
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    investigarVentasCristian();
}

module.exports = { investigarVentasCristian }; 