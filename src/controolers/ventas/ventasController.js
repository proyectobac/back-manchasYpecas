// controllers/ventasController.js
const { response, request } = require("express");
const { sequelize } = require('../../../database/config'); // Ajusta ruta
const Ventas = require("../../models/ventas/ventasModel");
const DetalleVenta = require("../../models/detalleVentas/detalleVentasModel");
const Productos = require("../../models/productos/productosModel");

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
            include: [ // Incluir detalles para la lista puede ser pesado, considera quitarlo o limitar campos
                 {
                     model: DetalleVenta,
                     as: 'detalles',
                     include: [{ model: Productos, as: 'producto', attributes: ['nombre']}]
                 }
            ],
            order: [['fecha_venta', 'DESC']]
        });
        res.json({ ok: true, total: listVentas.length, ventas: listVentas });
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

// --- Exportar ---
module.exports = {
    createVenta,
    getVentas,      // Opcional
    getVentaById    // Opcional
};