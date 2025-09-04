require('dotenv').config();
const { sequelize } = require('../database/config');

async function verificarFiltroUsuario() {
    console.log('🔍 VERIFICANDO FILTRO DE USUARIO EN VENTAS');
    console.log('═'.repeat(50));
    
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión exitosa.\n');

        // 1. Ver todos los usuarios
        console.log('👥 USUARIOS EN EL SISTEMA:');
        console.log('─'.repeat(30));
        const [usuarios] = await sequelize.query(`
            SELECT id_usuario, nombre_usuario, correo, telefono 
            FROM usuarios 
            ORDER BY id_usuario
        `);
        
        usuarios.forEach(usuario => {
            console.log(`ID: ${usuario.id_usuario} | Usuario: ${usuario.nombre_usuario} | Tel: ${usuario.telefono}`);
        });

        // 2. Ver todas las ventas con su usuario asignado
        console.log('\n🛒 TODAS LAS VENTAS:');
        console.log('─'.repeat(30));
        const [ventas] = await sequelize.query(`
            SELECT 
                v.id_venta,
                v.id_usuario,
                v.total_venta,
                v.nombre_cliente,
                v.telefono_cliente,
                v.fecha_venta,
                u.nombre_usuario
            FROM ventas v
            LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
            ORDER BY v.id_venta
        `);

        ventas.forEach(venta => {
            console.log(`VENTA #${venta.id_venta}:`);
            console.log(`   Usuario ID: ${venta.id_usuario || 'NULL'}`);
            console.log(`   Usuario: ${venta.nombre_usuario || 'Sin usuario'}`);
            console.log(`   Cliente: ${venta.nombre_cliente}`);
            console.log(`   Tel Cliente: ${venta.telefono_cliente}`);
            console.log(`   Total: $${venta.total_venta}`);
            console.log('');
        });

        // 3. Filtrar ventas por cada usuario específico
        console.log('🔍 VENTAS POR USUARIO:');
        console.log('─'.repeat(30));
        
        for (const usuario of usuarios) {
            console.log(`\n📋 VENTAS DE ${usuario.nombre_usuario} (ID: ${usuario.id_usuario}):`);
            
            const [ventasUsuario] = await sequelize.query(`
                SELECT 
                    v.id_venta,
                    v.total_venta,
                    v.nombre_cliente,
                    v.telefono_cliente
                FROM ventas v
                WHERE v.id_usuario = :id_usuario
                ORDER BY v.id_venta
            `, {
                replacements: { id_usuario: usuario.id_usuario }
            });

            if (ventasUsuario.length === 0) {
                console.log('   ✅ No tiene ventas (correcto si no ha comprado)');
            } else {
                ventasUsuario.forEach(venta => {
                    console.log(`   - Venta #${venta.id_venta}: $${venta.total_venta} (Cliente: ${venta.nombre_cliente})`);
                    
                    // Verificar si el teléfono del cliente coincide con el del usuario
                    const telefonoCoincide = venta.telefono_cliente === usuario.telefono;
                    console.log(`     ${telefonoCoincide ? '✅' : '⚠️'} Teléfono coincide: ${telefonoCoincide}`);
                });
            }
        }

        // 4. Verificar ventas huérfanas
        console.log('\n🔍 VENTAS SIN USUARIO:');
        console.log('─'.repeat(30));
        const [ventasSinUsuario] = await sequelize.query(`
            SELECT COUNT(*) as total
            FROM ventas 
            WHERE id_usuario IS NULL
        `);
        
        console.log(`Total ventas sin usuario: ${ventasSinUsuario[0].total}`);

        console.log('\n✅ Verificación completada');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sequelize.close();
    }
}

verificarFiltroUsuario(); 