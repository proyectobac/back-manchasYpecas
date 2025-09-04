require('dotenv').config();

// Importar modelos necesarios
const { sequelize } = require('../database/config');
const Usuario = require('../src/models/usuarios/usuariosModel');
const Producto = require('../src/models/productos/productosModel');
const Ventas = require('../src/models/ventas/ventasModel');
const DetalleVenta = require('../src/models/detalleVentas/detalleVentasModel');
const Pago = require('../src/models/pagos/pagosmodel');
const Clientes = require('../src/models/clientes/clientesModel');
const initModels = require('../src/models/initModels');

// Función para crear una venta directamente
async function crearVentaDirecta() {
    console.log('🚀 Iniciando creación de venta directa...\n');

    try {
        // Inicializar modelos
        initModels();
        
        // 1. Buscar usuario cliente
        console.log('👤 Buscando usuarios disponibles...');
        const usuarios = await Usuario.findAll({
            where: { estado: 'Activo' },
            include: [
                {
                    model: require('../src/models/rol/rolesModel'),
                    attributes: ['nombre']
                }
            ]
        });

        console.log('Usuarios encontrados:');
        usuarios.forEach(user => {
            console.log(`   - ${user.nombre_usuario} (${user.correo}) - Rol: ${user.Rol?.nombre || 'Sin rol'}`);
        });

        // Buscar específicamente cliente o usar el primero disponible
        let clienteUsuario = usuarios.find(u => u.Rol?.nombre === 'Cliente') || 
                            usuarios.find(u => u.nombre_usuario === 'ClienteTest') ||
                            usuarios[0];

        if (!clienteUsuario) {
            throw new Error('No se encontró ningún usuario para crear la venta');
        }

        console.log(`✅ Usando usuario: ${clienteUsuario.nombre_usuario} (ID: ${clienteUsuario.id_usuario})\n`);

        // 2. Buscar productos disponibles
        console.log('📦 Buscando productos disponibles...');
        const productos = await Producto.findAll({
            where: { 
                estado: 'Activo'
            },
            limit: 5
        });

        if (productos.length === 0) {
            throw new Error('No hay productos disponibles');
        }

        console.log('Productos encontrados:');
        productos.forEach(prod => {
            console.log(`   - ${prod.nombre} - Stock: ${prod.stock} - Precio: $${prod.precioVenta}`);
        });

        // Filtrar productos con stock y precio
        const productosDisponibles = productos.filter(p => 
            p.stock > 0 && p.precioVenta > 0
        );

        if (productosDisponibles.length === 0) {
            throw new Error('No hay productos con stock disponible');
        }

        console.log(`✅ ${productosDisponibles.length} productos disponibles para venta\n`);

        // 3. Crear datos de la venta
        const datosCliente = {
            nombreCompleto: `${clienteUsuario.nombre_usuario} ${clienteUsuario.apellido || 'Cliente'}`,
            telefono: clienteUsuario.telefono || '3001234567',
            direccion: 'Calle de Prueba 123',
            ciudad: 'Bogotá',
            notasAdicionales: 'Venta de prueba creada por script'
        };

        // Seleccionar hasta 2 productos para la venta
        const itemsVenta = [];
        for (let i = 0; i < Math.min(2, productosDisponibles.length); i++) {
            const producto = productosDisponibles[i];
            const cantidad = Math.min(producto.stock, Math.floor(Math.random() * 3) + 1); // 1-3 unidades
            
            itemsVenta.push({
                id_producto: producto.id_producto,
                cantidad: cantidad,
                precioUnitario: parseFloat(producto.precioVenta)
            });
        }

        console.log('🛒 Items de la venta:');
        itemsVenta.forEach((item, index) => {
            const producto = productosDisponibles.find(p => p.id_producto === item.id_producto);
            console.log(`   ${index + 1}. ${producto.nombre} - Cantidad: ${item.cantidad} - Precio: $${item.precioUnitario}`);
        });

        // 4. Crear la venta usando transacción
        console.log('\n💾 Creando venta en base de datos...');
        
        const transaction = await sequelize.transaction();

        try {
            let totalVenta = 0;
            const productosParaActualizar = [];

            // Validar stock y calcular total
            for (const item of itemsVenta) {
                const producto = await Producto.findByPk(item.id_producto, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (!producto) {
                    throw new Error(`Producto con ID ${item.id_producto} no encontrado`);
                }

                if (producto.stock < item.cantidad) {
                    throw new Error(`Stock insuficiente para ${producto.nombre}`);
                }

                productosParaActualizar.push({ producto, cantidadVendida: item.cantidad });
                totalVenta += item.cantidad * item.precioUnitario;
            }

            // Crear registro de pago
            const referenciaFinal = `SCRIPT-${Date.now()}`;
            const nuevoPago = await Pago.create({
                id_usuario: clienteUsuario.id_usuario,
                referencia_pago_interna: referenciaFinal,
                metodo_pago: 'EFECTIVO',
                monto: Math.round(totalVenta * 100), // En centavos
                estado: 'APROBADO',
                datos_cliente: datosCliente,
                items: itemsVenta,
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date()
            }, { transaction });

            // Crear venta
            const nuevaVenta = await Ventas.create({
                id_usuario: clienteUsuario.id_usuario,
                total_venta: parseFloat(totalVenta.toFixed(2)),
                estado_venta: 'Completada',
                metodo_pago: 'EFECTIVO',
                referencia_pago: referenciaFinal,
                numero_referencia: referenciaFinal,
                nombre_cliente: datosCliente.nombreCompleto,
                telefono_cliente: datosCliente.telefono,
                direccion_cliente: datosCliente.direccion,
                ciudad_cliente: datosCliente.ciudad,
                notas_cliente: datosCliente.notasAdicionales,
                fecha_venta: new Date()
            }, { transaction });

            // Asociar venta al pago
            await nuevoPago.update({ id_venta: nuevaVenta.id_venta }, { transaction });

            // Crear detalles de venta y actualizar stock
            for (const item of itemsVenta) {
                const subtotalLinea = item.cantidad * item.precioUnitario;
                
                await DetalleVenta.create({
                    id_venta: nuevaVenta.id_venta,
                    id_producto: item.id_producto,
                    cantidad: item.cantidad,
                    precio_unitario: parseFloat(item.precioUnitario.toFixed(2)),
                    subtotal_linea: parseFloat(subtotalLinea.toFixed(2))
                }, { transaction });

                // Actualizar stock
                const infoProducto = productosParaActualizar.find(p => p.producto.id_producto === item.id_producto);
                if (infoProducto) {
                    infoProducto.producto.stock -= infoProducto.cantidadVendida;
                    await infoProducto.producto.save({ transaction });
                }
            }

            // Confirmar transacción
            await transaction.commit();

            console.log('✅ Venta creada exitosamente:');
            console.log(`   ID Venta: ${nuevaVenta.id_venta}`);
            console.log(`   Referencia: ${nuevaVenta.numero_referencia}`);
            console.log(`   Total: $${nuevaVenta.total_venta}`);
            console.log(`   Cliente: ${nuevaVenta.nombre_cliente}`);
            console.log(`   Estado: ${nuevaVenta.estado_venta}`);

            // Agregar el id_usuario al objeto de retorno
            nuevaVenta.id_usuario = clienteUsuario.id_usuario;
            return nuevaVenta;

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('❌ Error al crear venta:', error.message);
        throw error;
    }
}

// Función para verificar compras del cliente
async function verificarComprasCliente(idUsuario) {
    console.log('\n🔍 Verificando compras del cliente...');
    
    try {
        const ventas = await Ventas.findAll({
            where: { id_usuario: idUsuario },
            include: [
                {
                    model: DetalleVenta,
                    as: 'detalles',
                    include: [
                        {
                            model: Producto,
                            as: 'producto',
                            attributes: ['nombre']
                        }
                    ]
                }
            ],
            order: [['fecha_venta', 'DESC']]
        });

        console.log(`📋 Cliente tiene ${ventas.length} compras:`);
        ventas.forEach((venta, index) => {
            console.log(`   ${index + 1}. Ref: ${venta.numero_referencia} - Total: $${venta.total_venta} - Estado: ${venta.estado_venta}`);
            venta.detalles.forEach(detalle => {
                console.log(`      - ${detalle.producto.nombre} x${detalle.cantidad} = $${detalle.subtotal_linea}`);
            });
        });

        return ventas;
    } catch (error) {
        console.error('❌ Error al verificar compras:', error.message);
        return [];
    }
}

// Función principal
async function main() {
    try {
        // Crear venta
        const venta = await crearVentaDirecta();
        
        // Verificar compras del cliente
        await verificarComprasCliente(venta.id_usuario);
        
        console.log('\n🎉 Script completado exitosamente!');
        
    } catch (error) {
        console.error('💥 Error fatal:', error);
    } finally {
        // Cerrar conexión
        await sequelize.close();
        process.exit(0);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = { crearVentaDirecta, verificarComprasCliente }; 