// controllers/ventasController.js
const { response, request } = require("express");
const { sequelize } = require('../../../database/config'); // Ajusta ruta
const Ventas = require("../../models/ventas/ventasModel");
const DetalleVenta = require("../../models/detalleVentas/detalleVentasModel");
const Productos = require("../../models/productos/productosModel");
const Pago = require("../../models/pagos/pagosmodel");
const cloudinary = require('../../../cloudinaryConfig'); // Importar Cloudinary
const fs = require('fs'); // Para manejar archivos temporales


// =====================================================================
// ==                FUNCIÓN PARA CREAR VENTA MANUAL                  ==
// ==           (Basada en createVenta, para uso interno)             ==
// =====================================================================
const crearVentaManual = async (req = request, res = response) => {
    // 1. --- Recibir y Validar Datos de Entrada ---
    const {
        cliente,
        items,
        metodo_pago,
        referencia_pago // Opcional, por si se quiere registrar una referencia externa
    } = req.body;

    // Se asume que un middleware (validarJWT) ya verificó el token
    // y añadió la info del usuario a req.usuario
    if (!req.usuario || !req.usuario.userId) {
        return res.status(401).json({ ok: false, msg: "No autorizado. Token inválido o no proporcionado." });
    }
    const id_empleado = req.usuario.userId;

    // --- Validaciones de Entrada (tomadas de tu createVenta original) ---
    if (!cliente || typeof cliente !== 'object' || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ ok: false, msg: 'Datos inválidos: Se requiere el objeto "cliente" y al menos un "item".' });
    }
    const camposClienteReq = ['nombreCompleto', 'telefono', 'direccion', 'ciudad'];
    for (const campo of camposClienteReq) {
        if (!cliente[campo] || String(cliente[campo]).trim() === '') {
            return res.status(400).json({ ok: false, msg: `Falta información del cliente: ${campo}` });
        }
    }
    if (!metodo_pago) {
        return res.status(400).json({ ok: false, msg: 'El método de pago es requerido.' });
    }
    for (const item of items) {
        if (!item.id_producto || isNaN(parseInt(item.id_producto)) || !item.cantidad || isNaN(parseInt(item.cantidad)) || item.cantidad <= 0 || item.precioUnitario === undefined || isNaN(parseFloat(item.precioUnitario)) || item.precioUnitario < 0) {
            return res.status(400).json({ ok: false, msg: `Item inválido: ${JSON.stringify(item)}. Verifique id_producto, cantidad (>0) y precioUnitario (>=0).` });
        }
    }

    // --- Iniciar Transacción ---
    const transaction = await sequelize.transaction();

    try {
        let calculatedTotalVenta = 0;
        const productosParaActualizar = [];

        // 2. --- Validar Stock, Estado y Calcular Total (con bloqueo) ---
        for (const item of items) {
            // Se usa "Productos" con 's' para coincidir con tu importación
            const producto = await Productos.findByPk(item.id_producto, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!producto) throw new Error(`Producto con ID ${item.id_producto} no encontrado.`);
            if (producto.estado !== 'Activo') throw new Error(`El producto "${producto.nombre}" no está activo.`);
            if ((producto.stock || 0) < item.cantidad) throw new Error(`Stock insuficiente para "${producto.nombre}".`);

            productosParaActualizar.push({ producto, cantidadVendida: item.cantidad });
            calculatedTotalVenta += item.cantidad * item.precioUnitario;
        }

        // 3. --- Crear Registro de PAGO (Diferencia clave con createVenta) ---
        const referenciaFinal = referencia_pago || `MANUAL-${metodo_pago.toUpperCase()}-${Date.now()}`;
        const nuevoPago = await Pago.create({
            id_usuario: id_empleado,
            referencia_pago_interna: referenciaFinal,
            metodo_pago: metodo_pago.toUpperCase(),
            monto: Math.round(calculatedTotalVenta * 100), // En centavos
            estado: 'APROBADO', // Se crea directamente como APROBADO
            datos_cliente: cliente, // Guardamos el objeto cliente completo
            items: items,
        }, { transaction });

        // 4. --- Crear VENTA (Cabecera), igual que en tu original pero con más datos ---
        const nuevaVenta = await Ventas.create({
            id_usuario: id_empleado, // Se añade el ID del empleado que registra
            total_venta: parseFloat(calculatedTotalVenta.toFixed(2)),
            estado_venta: 'Completada',
            metodo_pago: metodo_pago,
            referencia_pago: referenciaFinal, // Se guarda la referencia del pago
            nombre_cliente: cliente.nombreCompleto,
            telefono_cliente: cliente.telefono,
            direccion_cliente: cliente.direccion,
            ciudad_cliente: cliente.ciudad,
            notas_cliente: cliente.notasAdicionales || null,
        }, { transaction });

        // 5. --- Asociar Venta al Pago (Paso extra y necesario) ---
        await nuevoPago.update({ id_venta: nuevaVenta.id_venta }, { transaction });

        // 6. --- Crear DETALLES de Venta y Actualizar Stock (Lógica idéntica al original) ---
        for (const item of items) {
            const subtotalLinea = item.cantidad * item.precioUnitario;
            await DetalleVenta.create({
                id_venta: nuevaVenta.id_venta,
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio_unitario: parseFloat(item.precioUnitario.toFixed(2)),
                subtotal_linea: parseFloat(subtotalLinea.toFixed(2))
            }, { transaction });

            const infoProducto = productosParaActualizar.find(p => p.producto.id_producto === item.id_producto);
            if (infoProducto) {
                infoProducto.producto.stock -= infoProducto.cantidadVendida;
                await infoProducto.producto.save({ transaction });
            } else {
                throw new Error(`Error crítico: No se encontró info para actualizar stock del producto ID ${item.id_producto}.`);
            }
        }

        // 7. --- Confirmar Transacción ---
        await transaction.commit();

        // 8. --- Respuesta Exitosa ---
        res.status(201).json({
            ok: true,
            msg: 'Venta manual creada exitosamente',
            venta: {
                id_venta: nuevaVenta.id_venta,
                referencia_pago: nuevaVenta.referencia_pago
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error al crear la venta manual:', error.message);
        res.status(500).json({
            ok: false,
            msg: 'Error interno al procesar la venta.',
            error: error.message
        });
    }
};

// ... al lado de tus otras funciones del controlador ...

// =====================================================================
// ==              FUNCIÓN PARA MARCAR UNA VENTA COMO ENVIADA         ==
// =====================================================================
const marcarComoEnviada = async (req = request, res = response) => {
    const { id } = req.params; // ID de la venta

    try {
        const venta = await Ventas.findByPk(id);

        if (!venta) {
            return res.status(404).json({ ok: false, msg: `Venta con ID ${id} no encontrada.` });
        }

        // Solo se pueden enviar ventas que estén 'Completada'
        if (venta.estado_venta !== 'Completada') {
            return res.status(400).json({
                ok: false,
                msg: `Solo se pueden marcar como enviadas las ventas en estado 'Completada'. Estado actual: ${venta.estado_venta}`
            });
        }

        await venta.update({ estado_venta: 'Enviada' });

        res.json({
            ok: true,
            msg: `La venta #${id} ha sido marcada como 'Enviada'.`,
            venta: venta
        });

    } catch (error) {
        console.error('Error al marcar la venta como enviada:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor.'
        });
    }
};



// ---------------------------------------------------------------------
// Función para Crear una Venta (Pedido del Cliente)
// ---------------------------------------------------------------------
const createVenta = async (req = request, res = response) => {
    const { cliente, items } = req.body; // Recibe cliente e items (carrito)

    // 1. --- Validaciones de Entrada ---
    if (!cliente || typeof cliente !== 'object' || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ ok: false, msg: 'Datos inválidos: Se requiere información del cliente y al menos un item.' });
    }
    // Validar campos requeridos del cliente
    const camposClienteReq = ['nombreCompleto', 'telefono', 'direccion', 'ciudad'];
    for (const campo of camposClienteReq) {
        if (!cliente[campo] || cliente[campo].trim() === '') {
            return res.status(400).json({ ok: false, msg: `Falta información del cliente: ${campo}` });
        }
    }
    // Validar teléfono (simple)
    if (!/^\d+$/.test(cliente.telefono)) {
        return res.status(400).json({ ok: false, msg: 'Formato de teléfono inválido (solo números).' });
    }

    // Validar items
    for (const item of items) {
        if (!item.id_producto || isNaN(parseInt(item.id_producto)) || !item.cantidad || isNaN(parseInt(item.cantidad)) || item.cantidad <= 0 || item.precioUnitario === undefined || isNaN(parseFloat(item.precioUnitario)) || item.precioUnitario < 0) {
            return res.status(400).json({ ok: false, msg: `Item inválido en el carrito: ${JSON.stringify(item)}. Verifique ID, cantidad (>0) y precio (>=0).` });
        }
    }

    // Iniciar Transacción
    const transaction = await sequelize.transaction();

    try {
        let calculatedTotalVenta = 0;
        const productosParaActualizar = []; // Guardar productos y cantidad a descontar

        // 2. --- Validar Stock y Calcular Total (Primera pasada) ---
        for (const item of items) {
            const producto = await Productos.findByPk(item.id_producto, {
                transaction,
                lock: transaction.LOCK.UPDATE // Bloquear fila para evitar concurrencia en stock
            });

            if (!producto) {
                await transaction.rollback();
                return res.status(404).json({ ok: false, msg: `Producto con ID ${item.id_producto} no encontrado.` });
            }
            if (producto.estado !== 'Activo') {
                await transaction.rollback();
                return res.status(400).json({ ok: false, msg: `El producto "${producto.nombre}" no está activo y no se puede vender.` });
            }
            if ((producto.stock || 0) < item.cantidad) {
                await transaction.rollback();
                return res.status(400).json({ ok: false, msg: `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock || 0}, Solicitado: ${item.cantidad}.` });
            }

            // Guardar referencia al producto y cantidad para la actualización posterior
            productosParaActualizar.push({ producto, cantidadVendida: item.cantidad });

            // Calcular subtotal y total (usando el precio enviado por el frontend)
            calculatedTotalVenta += item.cantidad * item.precioUnitario;
        }

        // 3. --- Crear Venta (Cabecera) ---
        const nuevaVenta = await Ventas.create({
            id_usuario: req.usuario ? req.usuario.userId : null, // Agregar el ID del usuario que hace la compra
            total_venta: parseFloat(calculatedTotalVenta.toFixed(2)),
            estado_venta: 'Completada', // O 'Pendiente' si necesitas confirmación manual
            nombre_cliente: cliente.nombreCompleto,
            telefono_cliente: cliente.telefono,
            direccion_cliente: cliente.direccion,
            ciudad_cliente: cliente.ciudad,
            notas_cliente: cliente.notasAdicionales || null,
        }, { transaction });

        // 4. --- Crear Detalles y Actualizar Stock (Segunda pasada) ---
        for (const item of items) {
            // Crear detalle
            const subtotalLinea = item.cantidad * item.precioUnitario;
            await DetalleVenta.create({
                id_venta: nuevaVenta.id_venta,
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio_unitario: parseFloat(item.precioUnitario.toFixed(2)),
                subtotal_linea: parseFloat(subtotalLinea.toFixed(2))
            }, { transaction });

            // Encontrar el producto correspondiente en nuestra lista pre-cargada y bloqueada
            const infoProducto = productosParaActualizar.find(p => p.producto.id_producto === item.id_producto);
            if (infoProducto) {
                // Descontar stock
                infoProducto.producto.stock -= infoProducto.cantidadVendida;
                await infoProducto.producto.save({ transaction });
            } else {
                // Esto no debería ocurrir si la lógica es correcta, pero es una salvaguarda
                throw new Error(`Error crítico: No se encontró información para actualizar stock del producto ID ${item.id_producto}.`);
            }
        }

        // 5. --- Confirmar Transacción ---
        await transaction.commit();

        // 6. --- Respuesta Exitosa ---
        // Podrías devolver la venta creada con detalles si fuera necesario
        res.status(201).json({
            ok: true,
            msg: 'Pedido realizado con éxito. ¡Gracias por tu compra!',
            id_venta: nuevaVenta.id_venta // Devolver el ID puede ser útil
        });

    } catch (error) {
        await transaction.rollback(); // Revertir en caso de error
        console.error('Error al crear la venta:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor al procesar el pedido.',
            error: error.message
        });
    }
};

// --- Funciones Opcionales (getVentas, getVentaById) ---
const getVentas = async (req = request, res = response) => {
    try {
        const listVentas = await Ventas.findAll({
            include: [
                {
                    model: DetalleVenta,
                    as: 'detalles',
                    include: [{ model: Productos, as: 'producto', attributes: ['nombre'] }]
                },
                {
                    model: Pago,
                    as: 'pago',
                    attributes: ['referencia_pago_interna']
                }
            ],
            order: [['fecha_venta', 'DESC']]
        });

        // Transformar la respuesta para mostrar el código de pago
        const ventasFormateadas = listVentas.map(venta => {
            const ventaObj = venta.toJSON();
            if (ventaObj.pago) {
                ventaObj.pago.codigo_pago = ventaObj.pago.referencia_pago_interna;
                delete ventaObj.pago.referencia_pago_interna;
            }
            return ventaObj;
        });

        res.json({ ok: true, total: ventasFormateadas.length, ventas: ventasFormateadas });
    } catch (error) {
        console.error('Error al obtener las ventas:', error);
        res.status(500).json({ ok: false, msg: 'Error interno del servidor.' });
    }
};

const getVentaById = async (req = request, res = response) => {
    const { id } = req.params;
    if (isNaN(parseInt(id))) {
        return res.status(400).json({ ok: false, msg: 'ID de venta inválido.' });
    }
    try {
        const venta = await Ventas.findByPk(id, {
            include: [
                {
                    model: DetalleVenta,
                    as: 'detalles',
                    include: [{ model: Productos, as: 'producto' }] // Traer detalles completos del producto
                }
            ]
        });
        if (!venta) {
            return res.status(404).json({ ok: false, msg: `Venta con ID ${id} no encontrada.` });
        }
        res.json({ ok: true, venta });
    } catch (error) {
        console.error(`Error al obtener la venta ${id}:`, error);
        res.status(500).json({ ok: false, msg: 'Error interno del servidor.' });
    }
};

// ---------------------------------------------------------------------
// Función para Confirmar Entrega de una Venta con Imagen
// ---------------------------------------------------------------------
const confirmDelivery = async (req = request, res = response) => {
    const { id } = req.params; // ID de la venta

    try {
        // 1. Validar que existe la venta
        const venta = await Ventas.findByPk(id);
        if (!venta) {
            // Si hay archivo temporal, borrarlo
            if (req.file && req.file.path) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({
                ok: false,
                msg: `No se encontró la venta con ID ${id}.`
            });
        }

        // 2. Validar que es una venta con pago PSE y en estado Enviada
        if (venta.metodo_pago !== 'PSE') {
            if (req.file && req.file.path) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                ok: false,
                msg: 'Solo se pueden confirmar entregas de ventas pagadas por PSE.'
            });
        }

        if (venta.estado_venta !== 'Enviada') {
            if (req.file && req.file.path) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                ok: false,
                msg: 'Solo se pueden confirmar entregas de ventas en estado Enviada.'
            });
        }

        // 3. Validar que se subió una imagen
        if (!req.file) {
            return res.status(400).json({
                ok: false,
                msg: 'Se requiere una imagen de confirmación de entrega.'
            });
        }

        // 4. Subir imagen a Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'delivery_confirmations',
            transformation: [
                { width: 1024, height: 1024, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        });

        // 5. Borrar archivo temporal
        fs.unlinkSync(req.file.path);

        // 6. Actualizar la venta
        await venta.update({
            estado_venta: 'Recibido',
            confirmation_image: result.secure_url
        });

        // 7. Responder con éxito
        res.json({
            ok: true,
            msg: 'Entrega confirmada exitosamente.',
            venta: {
                id_venta: venta.id_venta,
                estado_venta: venta.estado_venta,
                confirmation_image: venta.confirmation_image
            }
        });

    } catch (error) {
        // Si hay error y existe archivo temporal, borrarlo
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Error al confirmar la entrega:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno al confirmar la entrega.',
            error: error.message
        });
    }
};

// =====================================================================
// ==              FUNCIONES PARA CLIENTES - VER SUS COMPRAS        ==
// =====================================================================

/**
 * Obtiene todas las compras realizadas por el cliente autenticado
 * Incluye tanto ventas confirmadas como pagos en efectivo pendientes
 */
const getMisComprasCliente = async (req = request, res = response) => {
    try {
        // Las validaciones de autenticación y rol se manejan en los middlewares
        const id_usuario = req.usuario.userId;

        // 1. Obtener las ventas confirmadas del cliente
        const ventas = await Ventas.findAll({
            where: { id_usuario: id_usuario },
            include: [
                {
                    model: DetalleVenta,
                    as: 'detalles',
                    include: [
                        {
                            model: Productos,
                            as: 'producto',
                            attributes: ['id_producto', 'nombre', 'foto']
                        }
                    ]
                }
            ],
            order: [['fecha_venta', 'DESC']]
        });

        // 2. Obtener pagos en efectivo pendientes del cliente usando SQL directo
        const [pagosPendientesRaw] = await sequelize.query(`
            SELECT 
                pe.codigo_pago,
                pe.fecha_vencimiento,
                pe.createdAt,
                pe.estado as estado_pago_efectivo,
                p.id_pago,
                p.monto,
                p.estado as estado_pago,
                p.datos_cliente,
                p.items
            FROM pagos_efectivo pe
            INNER JOIN pagos p ON pe.id_pago = p.id_pago
            WHERE p.id_usuario = ? 
                AND p.metodo_pago = 'EFECTIVO' 
                AND pe.estado = 'PENDIENTE'
                AND p.estado = 'PENDIENTE'
            ORDER BY pe.createdAt DESC
        `, {
            replacements: [id_usuario]
        });

        // 3. Formatear ventas confirmadas
        const ventasFormateadas = ventas.map(venta => ({
            id_venta: venta.id_venta,
            numero_referencia: venta.numero_referencia,
            fecha_venta: venta.fecha_venta,
            total_venta: venta.total_venta,
            estado_venta: venta.estado_venta,
            metodo_pago: venta.metodo_pago,
            nombre_cliente: venta.nombre_cliente,
            telefono_cliente: venta.telefono_cliente,
            direccion_cliente: venta.direccion_cliente,
            ciudad_cliente: venta.ciudad_cliente,
            cantidad_productos: venta.detalles ? venta.detalles.length : 0,
            tipo: 'venta' // Para identificar que es una venta confirmada
        }));

        // 4. Formatear pagos pendientes como "compras"
        const pagosPendientesFormateados = pagosPendientesRaw.map(pagoPendiente => {
            // Parsear datos_cliente si es string JSON
            let datosCliente = {};
            try {
                datosCliente = typeof pagoPendiente.datos_cliente === 'string' 
                    ? JSON.parse(pagoPendiente.datos_cliente) 
                    : pagoPendiente.datos_cliente || {};
            } catch (e) {
                datosCliente = {};
            }

            // Parsear items si es string JSON
            let items = [];
            try {
                items = typeof pagoPendiente.items === 'string' 
                    ? JSON.parse(pagoPendiente.items) 
                    : pagoPendiente.items || [];
            } catch (e) {
                items = [];
            }

            return {
                id_venta: `pendiente_${pagoPendiente.codigo_pago}`, // ID temporal
                numero_referencia: pagoPendiente.codigo_pago,
                fecha_venta: pagoPendiente.createdAt,
                total_venta: pagoPendiente.monto / 100, // Convertir de centavos
                estado_venta: 'Pago Pendiente - Efectivo',
                metodo_pago: 'EFECTIVO',
                nombre_cliente: datosCliente.nombre || 'Cliente',
                telefono_cliente: datosCliente.telefono || '',
                direccion_cliente: datosCliente.direccion || '',
                ciudad_cliente: datosCliente.ciudad || '',
                cantidad_productos: Array.isArray(items) ? items.length : 0,
                codigo_pago: pagoPendiente.codigo_pago,
                fecha_vencimiento: pagoPendiente.fecha_vencimiento,
                tipo: 'pago_pendiente' // Para identificar que es un pago pendiente
            };
        });

        // 5. Combinar y ordenar todas las compras
        const todasLasCompras = [...ventasFormateadas, ...pagosPendientesFormateados];
        todasLasCompras.sort((a, b) => new Date(b.fecha_venta) - new Date(a.fecha_venta));

        res.json({
            ok: true,
            ventas: todasLasCompras,
            total: todasLasCompras.length,
            resumen: {
                ventas_confirmadas: ventasFormateadas.length,
                pagos_pendientes: pagosPendientesFormateados.length
            }
        });

    } catch (error) {
        console.error('Error al obtener las compras del cliente:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Obtiene el detalle de una compra específica del cliente autenticado
 */
const getDetalleCompraCliente = async (req = request, res = response) => {
    try {
        const { id } = req.params;
        
        // Las validaciones de autenticación y rol se manejan en los middlewares
        const id_usuario = req.usuario.userId;

        // Buscar la venta específica del cliente
        const venta = await Ventas.findOne({
            where: { 
                id_venta: id,
                id_usuario: id_usuario // Verificar que la venta pertenezca al cliente
            },
            include: [
                {
                    model: DetalleVenta,
                    as: 'detalles',
                    include: [
                        {
                            model: Productos,
                            as: 'producto',
                            attributes: ['id_producto', 'nombre', 'descripcion', 'foto', 'categoria']
                        }
                    ]
                }
            ]
        });

        if (!venta) {
            return res.status(404).json({
                ok: false,
                msg: 'Compra no encontrada o no tienes permisos para verla'
            });
        }

        // Formatear el detalle para el frontend
        const detalleFormateado = {
            id_venta: venta.id_venta,
            numero_referencia: venta.numero_referencia,
            fecha_venta: venta.fecha_venta,
            total_venta: venta.total_venta,
            estado_venta: venta.estado_venta,
            metodo_pago: venta.metodo_pago,
            nombre_cliente: venta.nombre_cliente,
            telefono_cliente: venta.telefono_cliente,
            direccion_cliente: venta.direccion_cliente,
            ciudad_cliente: venta.ciudad_cliente,
            notas_cliente: venta.notas_cliente
        };

        const detallesFormateados = venta.detalles.map(detalle => ({
            id_detalle_venta: detalle.id_detalle_venta,
            cantidad: detalle.cantidad,
            precio_unitario: detalle.precio_unitario,
            subtotal_linea: detalle.subtotal_linea,
            producto: detalle.producto
        }));

        res.json({
            ok: true,
            venta: detalleFormateado,
            detalles: detallesFormateados
        });

    } catch (error) {
        console.error('Error al obtener el detalle de la compra:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor',
            error: error.message
        });
    }
};

// --- Exportar ---
module.exports = {
    createVenta,
    getVentas,
    getVentaById,
    confirmDelivery,
    marcarComoEnviada,
    crearVentaManual,
    getMisComprasCliente,
    getDetalleCompraCliente
};