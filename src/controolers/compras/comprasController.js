// controllers/comprasController.js
const { response, request } = require("express");
const { sequelize } = require('../../../database/config'); // Ajusta ruta
const Compras = require("../../models/compras/comprasModel");
const DetallesCompra = require("../../models/detalleCompra/detallesCompraModel");
const Productos = require("../../models/productos/productosModel");
const Proveedores = require("../../models/proveedores/proveedoresModel");

// Función para Crear una nueva Compra y sus Detalles (Transacción)
const createCompra = async (req = request, res = response) => {
    const {
        id_proveedor,
        numero_referencia,
        fecha_compra, // Opcional, puede venir del frontend o usar default
        estado_compra = 'Recibida', // Default si no viene
        detalles // Array de objetos: { id_producto, cantidad, precio_costo_unitario, margen_aplicado }
    } = req.body;

    // Validaciones básicas de entrada
    if (!id_proveedor || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({
            ok: false,
            msg: 'Faltan datos requeridos: id_proveedor o detalles de la compra válidos.'
        });
    }

    // Iniciar transacción
    const transaction = await sequelize.transaction();

    try {
        // 1. Verificar si el proveedor existe
        const proveedorExiste = await Proveedores.findByPk(id_proveedor, { transaction });
        if (!proveedorExiste) {
            await transaction.rollback();
            return res.status(404).json({ ok: false, msg: `Proveedor con ID ${id_proveedor} no encontrado.` });
        }

        let totalCompraCalculado = 0;
        const detallesParaCrear = [];
        const actualizacionesProducto = [];

        // 2. Procesar cada detalle para validación y cálculos
        for (const detalle of detalles) {
            const { id_producto, cantidad, precio_costo_unitario, margen_aplicado } = detalle;

            // Validar datos del detalle
            if (!id_producto || !cantidad || cantidad <= 0 || precio_costo_unitario === undefined || precio_costo_unitario < 0) {
                await transaction.rollback();
                return res.status(400).json({ ok: false, msg: `Detalle inválido para producto ID ${id_producto}. Verifique cantidad y precio de costo.` });
            }

            // Verificar si el producto existe
            const producto = await Productos.findByPk(id_producto, { transaction });
            if (!producto) {
                await transaction.rollback();
                return res.status(404).json({ ok: false, msg: `Producto con ID ${id_producto} no encontrado.` });
            }

            // Calcular subtotal de la línea
            const subtotalLinea = parseFloat(cantidad) * parseFloat(precio_costo_unitario);
            totalCompraCalculado += subtotalLinea;

            // Calcular precio de venta según tu fórmula (¡¡IMPORTANTE: Verifica si esta es la fórmula correcta!!)
            // Basado en tu ejemplo: Valor venta = Valor producto / (1 - (Margen / 100))
            // Ejemplo: 25000 / (1 - (8 / 100)) = 25000 / (1 - 0.08) = 25000 / 0.92 = 27173.91...
            // TU EJEMPLO daba 31250 (25000 / 0.8). Si esa es la lógica deseada, ajusta la fórmula.
            // Usaremos la fórmula estándar de margen por ahora. ¡AJUSTAR SI ES NECESARIO!
            let precioVentaCalculado = null;
            if (margen_aplicado !== undefined && margen_aplicado !== null && margen_aplicado >= 0) {
                 // Asegurarse que margen no sea 100 o más para evitar división por cero o negativo
                if(margen_aplicado < 100) {
                    precioVentaCalculado = parseFloat(precio_costo_unitario) / (1 - (parseFloat(margen_aplicado) / 100));
                } else {
                     console.warn(`Margen de ${margen_aplicado}% es inválido para calcular precio de venta del producto ${id_producto}. Se dejará el precio de venta actual.`);
                     precioVentaCalculado = producto.precioVenta; // O dejarlo null o el costo
                }
            } else {
                 console.warn(`Margen no proporcionado o inválido para producto ${id_producto}. Se dejará el precio de venta actual.`);
                 precioVentaCalculado = producto.precioVenta; // Mantener el precio de venta existente si no hay margen
            }


            detallesParaCrear.push({
                // id_compra se asignará después
                id_producto,
                cantidad: parseInt(cantidad),
                precio_costo_unitario: parseFloat(precio_costo_unitario),
                margen_aplicado: (margen_aplicado !== undefined && margen_aplicado !== null) ? parseFloat(margen_aplicado) : null,
                precio_venta_calculado: precioVentaCalculado ? parseFloat(precioVentaCalculado.toFixed(2)) : producto.precioVenta, // Redondear a 2 decimales
                subtotal_linea: parseFloat(subtotalLinea.toFixed(2)) // Redondear
            });

            // Preparar actualización del producto (stock, precio costo, precio venta)
            actualizacionesProducto.push({
                id_producto,
                cantidadAAgregar: parseInt(cantidad),
                nuevoPrecioCosto: parseFloat(precio_costo_unitario),
                nuevoPrecioVenta: precioVentaCalculado ? parseFloat(precioVentaCalculado.toFixed(2)) : producto.precioVenta // Usar el calculado o el existente
            });
        }

        // 3. Crear la cabecera de la Compra
        const nuevaCompra = await Compras.create({
            id_proveedor,
            numero_referencia,
            fecha_compra, // Usará el default si es null/undefined
            total_compra: parseFloat(totalCompraCalculado.toFixed(2)), // Redondear total
            estado_compra
        }, { transaction });

        // 4. Crear los Detalles de Compra asociándolos a la nueva Compra
        for (const detalleData of detallesParaCrear) {
            await DetallesCompra.create({
                ...detalleData,
                id_compra: nuevaCompra.id_compra // Asignar el ID de la compra creada
            }, { transaction });
        }

        // 5. Actualizar el Stock y Precios de los Productos
        for (const update of actualizacionesProducto) {
            const productoAActualizar = await Productos.findByPk(update.id_producto, { transaction });
            if (productoAActualizar) {
                productoAActualizar.stock += update.cantidadAAgregar;
                productoAActualizar.precioCosto = update.nuevoPrecioCosto; // Actualiza al último costo
                productoAActualizar.precioVenta = update.nuevoPrecioVenta; // Actualiza al último precio de venta calculado
                await productoAActualizar.save({ transaction });
            } else {
                // Esto no debería pasar porque ya verificamos, pero por si acaso
                throw new Error(`Producto ${update.id_producto} no encontrado durante la actualización de stock.`);
            }
        }

        // 6. Si todo fue bien, confirmar la transacción
        await transaction.commit();

        // 7. Obtener la compra creada con sus detalles para la respuesta
        const compraCreada = await Compras.findByPk(nuevaCompra.id_compra, {
            include: [
                { model: Proveedores, as: 'proveedor', attributes: ['nombre'] },
                {
                    model: DetallesCompra,
                    as: 'detalles',
                    include: [{ model: Productos, as: 'producto', attributes: ['nombre'] }]
                }
            ]
        });

        res.status(201).json({
            ok: true,
            msg: 'Compra registrada exitosamente.',
            compra: compraCreada
        });

    } catch (error) {
        // Si hay algún error, deshacer la transacción
        await transaction.rollback();
        console.error('Error al crear la compra:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor al registrar la compra. Por favor, contacte al administrador.',
            error: error.message // Proporciona más detalles en el log o en modo desarrollo
        });
    }
};

// Función para Obtener todas las Compras con Detalles
const getCompras = async (req = request, res = response) => {
    try {
        const listCompras = await Compras.findAll({
            include: [
                {
                    model: Proveedores,
                    as: 'proveedor', // Alias definido en la asociación
                    attributes: ['nombre'] // Solo traer el nombre del proveedor
                },
                {
                    model: DetallesCompra,
                    as: 'detalles', // Alias definido en la asociación
                    include: [{
                        model: Productos,
                        as: 'producto', // Alias definido en la asociación
                        attributes: ['nombre'] // Solo traer el nombre del producto
                    }]
                }
            ],
            order: [['fecha_compra', 'DESC']] // Ordenar por fecha descendente (más nuevas primero)
        });

        res.json({
            ok: true,
            total: listCompras.length,
            compras: listCompras
        });

    } catch (error) {
        console.error('Error al obtener las compras:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor al obtener las compras.'
        });
    }
};

// Función para Obtener una Compra específica por ID con Detalles
const getCompraById = async (req = request, res = response) => {
    const { id } = req.params;

    try {
        const compra = await Compras.findByPk(id, {
             include: [
                {
                    model: Proveedores,
                    as: 'proveedor',
                    attributes: ['nombre', 'num_documento', 'telefono', 'email'] // Más detalles del proveedor
                },
                {
                    model: DetallesCompra,
                    as: 'detalles',
                    include: [{
                        model: Productos,
                        as: 'producto',
                        attributes: ['nombre', 'categoria'] // Más detalles del producto
                    }]
                }
            ]
        });

        if (!compra) {
            return res.status(404).json({
                ok: false,
                msg: `No se encontró la compra con ID ${id}`
            });
        }

        res.json({
            ok: true,
            compra
        });

    } catch (error) {
        console.error(`Error al obtener la compra ${id}:`, error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor al obtener la compra.'
        });
    }
};


// --- Opcional: Actualizar Estado de Compra ---
const updateCompraEstado = async (req = request, res = response) => {
    const { id } = req.params;
    const { estado_compra } = req.body;

    if (!estado_compra || !['Pendiente', 'Recibida', 'Cancelada'].includes(estado_compra)) {
        return res.status(400).json({ ok: false, msg: 'Estado de compra inválido.' });
    }

    // ADVERTENCIA: Cambiar a 'Cancelada' DEBERÍA revertir el stock si ya estaba 'Recibida'.
    // Esta implementación simple SOLO cambia el estado. La lógica de revertir stock es compleja.
    const transaction = await sequelize.transaction();
    try {
        const compra = await Compras.findByPk(id, { transaction });
        if (!compra) {
            await transaction.rollback();
            return res.status(404).json({ ok: false, msg: `Compra con ID ${id} no encontrada.` });
        }

        // Lógica compleja de reversión de stock (NO IMPLEMENTADA AQUÍ por simplicidad)
        if (compra.estado_compra === 'Recibida' && estado_compra === 'Cancelada') {
             console.warn(`ADVERTENCIA: La compra ${id} se está cancelando pero el stock NO se está revirtiendo automáticamente.`);
             // Aquí iría la lógica para restar el stock de los productos involucrados.
        }

        compra.estado_compra = estado_compra;
        await compra.save({ transaction });
        await transaction.commit();

        res.json({ ok: true, msg: 'Estado de la compra actualizado.', compra });

    } catch (error) {
        await transaction.rollback();
        console.error(`Error al actualizar estado de compra ${id}:`, error);
        res.status(500).json({ ok: false, msg: 'Error interno al actualizar estado.' });
    }
};

// --- Opcional: Eliminar Compra ---
// ADVERTENCIA MUY IMPORTANTE: Eliminar compras generalmente NO es buena práctica.
// Puede causar inconsistencias graves en stock e historial financiero.
// Es MUCHO MEJOR usar el estado 'Cancelada'. ¡Usa esta función con extrema precaución!
const deleteCompra = async (req = request, res = response) => {
    const { id } = req.params;

    // ADVERTENCIA: Esta función NO revierte las actualizaciones de stock realizadas al crear la compra.
    const transaction = await sequelize.transaction();
    try {
        const compra = await Compras.findByPk(id, { include: ['detalles'], transaction });
        if (!compra) {
            await transaction.rollback();
            return res.status(404).json({ ok: false, msg: `Compra con ID ${id} no encontrada.` });
        }

        // 1. Eliminar detalles asociados
        await DetallesCompra.destroy({ where: { id_compra: id }, transaction });

        // 2. Eliminar la compra principal
        await compra.destroy({ transaction });

        // 3. Confirmar transacción
        await transaction.commit();

         console.warn(`ADVERTENCIA CRÍTICA: Compra ${id} eliminada. El stock de los productos asociados NO ha sido revertido automáticamente.`);
        res.json({ ok: true, msg: `Compra ${id} eliminada permanentemente (¡Stock no revertido!)` });

    } catch (error) {
        await transaction.rollback();
        console.error(`Error al eliminar compra ${id}:`, error);
        res.status(500).json({ ok: false, msg: 'Error interno al eliminar la compra.' });
    }







    
};


const VALID_ESTADOS_COMPRA = ['Pendiente de Pago', 'Pagada', 'Pagado Parcial', 'Cancelada'];

const updateCompra = async (req = request, res = response) => {
    const { id } = req.params;
    const { id_proveedor, numero_referencia, estado_compra, monto_pagado } = req.body;

    // 1. --- Validaciones de Entrada ---
    if (isNaN(parseInt(id))) {
        return res.status(400).json({ ok: false, msg: 'ID de compra inválido.' });
    }
    if (!id_proveedor || isNaN(parseInt(id_proveedor))) {
        return res.status(400).json({ ok: false, msg: 'ID de proveedor inválido o faltante.' });
    }
    if (!estado_compra || !VALID_ESTADOS_COMPRA.includes(estado_compra)) {
        return res.status(400).json({ ok: false, msg: `Estado de compra inválido. Valores permitidos: ${VALID_ESTADOS_COMPRA.join(', ')}` });
    }
     // Validar monto_pagado: debe ser número no negativo o null/undefined
    const montoPagadoNum = (monto_pagado === null || monto_pagado === undefined || monto_pagado === '') ? null : parseFloat(monto_pagado);
    if (montoPagadoNum !== null && (isNaN(montoPagadoNum) || montoPagadoNum < 0)) {
        return res.status(400).json({ ok: false, msg: 'Monto pagado debe ser un número positivo o nulo.' });
    }

    const transaction = await sequelize.transaction(); // Usar transacción por si hay lógica compleja futura

    try {
        // 2. --- Encontrar la Compra ---
        const compra = await Compras.findByPk(id, { transaction });
        if (!compra) {
            await transaction.rollback();
            return res.status(404).json({ ok: false, msg: `Compra con ID ${id} no encontrada.` });
        }

        // 3. --- Verificar que el nuevo Proveedor exista ---
        const proveedorExiste = await Proveedores.findByPk(id_proveedor, { transaction });
        if (!proveedorExiste) {
            await transaction.rollback();
            return res.status(404).json({ ok: false, msg: `Proveedor con ID ${id_proveedor} no encontrado.` });
        }

        // 4. --- Validaciones de Lógica de Negocio ---
        const totalCompraNum = parseFloat(compra.total_compra);

        // Validar que monto_pagado no exceda el total
        if (montoPagadoNum !== null && montoPagadoNum > totalCompraNum) {
             await transaction.rollback();
             return res.status(400).json({ ok: false, msg: `El monto pagado (${montoPagadoNum}) no puede exceder el total (${totalCompraNum}).` });
        }
         // Validar consistencia entre estado y monto pagado
         if (estado_compra === 'Pagada' && (montoPagadoNum === null || montoPagadoNum < totalCompraNum)) {
             // Si el frontend ya ajustó y envió el monto = total, esta validación no es necesaria.
             // Si queremos asegurar aquí, podemos ajustar o devolver error.
             // Por ahora, confiaremos en el frontend que envía el monto ajustado si el estado es 'Pagada'.
             // O podríamos ajustar aquí:
             // if (montoPagadoNum === null || montoPagadoNum < totalCompraNum) {
             //    console.warn(`Ajustando monto pagado a ${totalCompraNum} para estado 'Pagada' en compra ${id}.`);
             //    monto_pagado_final = totalCompraNum; // Usar una variable temporal
             // } else {
             //    monto_pagado_final = montoPagadoNum;
             // }
              console.warn(`Compra ${id} marcada como 'Pagada', pero monto pagado (${montoPagadoNum}) podría ser menor al total (${totalCompraNum}). Asegúrate que el monto sea correcto.`);
         }
         if (estado_compra === 'Pagado Parcial' && (montoPagadoNum === null || montoPagadoNum <= 0 || montoPagadoNum >= totalCompraNum)) {
             await transaction.rollback();
             return res.status(400).json({ ok: false, msg: `Para 'Pagado Parcial', el monto pagado (${montoPagadoNum}) debe ser mayor a 0 y menor al total (${totalCompraNum}).` });
         }

        // *** ADVERTENCIA IMPORTANTE SOBRE CANCELACIÓN Y STOCK ***
        if (compra.estado_compra !== 'Cancelada' && estado_compra === 'Cancelada') {
             console.warn(`ADVERTENCIA: Compra ${id} marcada como 'Cancelada'. El stock de los productos NO se revierte automáticamente en esta operación de actualización.`);
             // Aquí NO se implementa la reversión de stock por complejidad.
             // Debería hacerse en una operación separada o con lógica más avanzada si es necesario.
        }

        // 5. --- Actualizar los campos de la compra ---
        compra.id_proveedor = id_proveedor;
        compra.numero_referencia = numero_referencia || null; // Guardar null si está vacío
        compra.estado_compra = estado_compra;
        compra.monto_pagado = montoPagadoNum; // Guardar el número o null

        // 6. --- Guardar Cambios ---
        await compra.save({ transaction });

        // 7. --- Confirmar Transacción ---
        await transaction.commit();

        // 8. --- Devolver Respuesta ---
        // Puedes devolver la compra actualizada, tal vez con el proveedor asociado
        const compraActualizada = await Compras.findByPk(id, {
            include: [{ model: Proveedores, as: 'proveedor', attributes: ['nombre'] }] // Opcional incluir proveedor
        });

        res.json({
            ok: true,
            msg: 'Compra actualizada correctamente.',
            compra: compraActualizada || compra // Devolver el objeto actualizado o el que se guardó
        });

    } catch (error) {
        await transaction.rollback(); // Revertir en caso de error
        console.error(`Error al actualizar la compra ${id}:`, error);
         if (error.name === 'SequelizeUniqueConstraintError') {
             return res.status(400).json({ ok: false, msg: error.errors[0]?.message || 'Error de restricción única (quizás Nº Referencia duplicado).' });
        }
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor al actualizar la compra.',
            error: error.message
        });
    }
};




module.exports = {
    createCompra,
    getCompras,
    getCompraById,
    updateCompraEstado, // Opcional
    updateCompra,
    deleteCompra      // Opcional y peligroso
};