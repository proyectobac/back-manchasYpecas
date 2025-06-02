// controllers/pagos/pagosController.js
const axios = require('axios');
const crypto = require('crypto');
const WOMPI_CONFIG = require('../../config/wompiConfig');
const Pago = require('../../models/pagos/pagosmodel');         // Ajusta ruta
const Venta = require('../../models/ventas/ventasModel');       // Ajusta ruta
const DetalleVenta = require('../../models/detalleVentas/detalleVentasModel'); // Ajusta ruta
const Producto = require('../../models/productos/productosModel');   // Ajusta ruta
const Usuario = require('../../models/usuarios/usuariosModel');     // Ajusta ruta
const { sequelize } = require('../../../database/config');         // Ajusta ruta
const { response, request } = require("express"); // Para tipado

// --- Variables de Entorno ---
const WOMPI_API_URL = process.env.WOMPI_API_URL;
const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY;
const WOMPI_EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET;
const PAYMENT_REDIRECT_BASE_URL = process.env.PAYMENT_REDIRECT_BASE_URL; // URL Base Frontend

// --- Helper para generar Referencia Única ---
const generarReferenciaUnica = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `MP-${timestamp}-${random}`;
};

// --- OBTENER BANCOS PSE ---
const obtenerBancosPSE = async (req = request, res = response) => {
    try {
        WOMPI_CONFIG.validate();
        const url = `${WOMPI_CONFIG.getApiUrl()}/pse/financial_institutions`;
        
        console.log('Obteniendo lista de bancos PSE desde:', url);
        
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${WOMPI_CONFIG.PUBLIC_KEY}` }
        });

        if (!response.data?.data) {
            throw new Error('Respuesta inválida de Wompi');
        }

        // Transformar y ordenar la lista de bancos
        const bancos = response.data.data
            .map(banco => ({
                financial_institution_code: banco.financial_institution_code,
                financial_institution_name: banco.financial_institution_name,
                type: banco.type || 'persona_natural'
            }))
            .sort((a, b) => a.financial_institution_name.localeCompare(b.financial_institution_name));

        res.json({
            success: true,
            bancos
        });

    } catch (error) {
        console.error('Error al obtener bancos PSE:', error);
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error?.message || 'Error al obtener la lista de bancos PSE'
        });
    }
};

// --- INICIAR PAGO PSE ---
const iniciarPagoPSE = async (req = request, res = response) => {
    console.log('Token decodificado:', req.usuario);
    const id_usuario = req.usuario.userId;
    console.log('ID de usuario extraído:', id_usuario);
    
    const {
        banco_codigo,
        tipo_persona = 'natural',
        tipo_documento = 'CC',
        documento,
        nombre_completo,
        email,
        items,
        telefono,
        direccion_entrega,
        ciudad,
        notasAdicionales
    } = req.body;

    // Validaciones exhaustivas para PSE
    const validaciones = [
        { campo: 'banco_codigo', valor: banco_codigo, mensaje: 'Código de banco es requerido' },
        { campo: 'documento', valor: documento, mensaje: 'Número de documento es requerido' },
        { campo: 'nombre_completo', valor: nombre_completo, mensaje: 'Nombre completo es requerido' },
        { campo: 'email', valor: email, mensaje: 'Email es requerido' },
        { campo: 'items', valor: items?.length > 0, mensaje: 'Debe incluir al menos un item' },
        { campo: 'direccion_entrega', valor: direccion_entrega, mensaje: 'Dirección de entrega es requerida' },
        { campo: 'ciudad', valor: ciudad, mensaje: 'Ciudad es requerida' }
    ];

    const errores = validaciones
        .filter(v => !v.valor)
        .map(v => v.mensaje);

    if (errores.length > 0) {
        return res.status(400).json({
            success: false,
            errores
        });
    }

    const transaction = await sequelize.transaction();

    try {
        // 1. Validar stock y calcular total
        let total_en_centavos = 0;
        const itemsValidados = [];

        for (const item of items) {
            const producto = await Producto.findByPk(item.id_producto, { transaction });
            if (!producto) {
                throw new Error(`Producto no encontrado: ${item.id_producto}`);
            }
            if (producto.stock < item.cantidad) {
                throw new Error(`Stock insuficiente para ${producto.nombre}`);
            }
            
            const precioEnCentavos = Math.round(item.precioVenta * item.cantidad * 100);
            total_en_centavos += precioEnCentavos;
            
            itemsValidados.push({
                ...item,
                nombre_producto: producto.nombre,
                precio_unitario: item.precioVenta,
                subtotal: precioEnCentavos
            });
        }

        // 2. Crear registro de pago pendiente
        const referencia = generarReferenciaUnica();
        const nuevoPago = await Pago.create({
            id_usuario,
            referencia_pago_interna: referencia,
            metodo_pago: 'PSE',
            banco_pse: banco_codigo,
            monto: total_en_centavos,
            moneda: 'COP',
            estado: 'PENDIENTE',
            datos_cliente: {
                nombre: nombre_completo,
                email,
                telefono,
                documento,
                tipo_documento,
                tipo_persona,
                direccion: direccion_entrega,
                ciudad,
                notasAdicionales
            },
            items: itemsValidados
        }, { transaction });

        // 3. Preparar payload para Wompi (usando el endpoint de links de pago)
        const wompiPayload = {
            name: `Pago ManchasYPecas - ${referencia}`,
            description: `Compra en ManchasYPecas - ${itemsValidados.map(i => i.nombre_producto).join(', ')}`,
            single_use: true,
            collect_shipping: false,
            currency: "COP",
            amount_in_cents: total_en_centavos,
            redirect_url: `${process.env.PAYMENT_REDIRECT_BASE_URL}/resultado-pago/${referencia}`,
            customer_data: {
                customer_references: [
                    {
                        label: "Tipo de documento",
                        value: tipo_documento,
                        is_required: true
                    },
                    {
                        label: "Número de documento",
                        value: documento,
                        is_required: true
                    }
                ]
            }

        };

        console.log('Payload para Wompi:', JSON.stringify(wompiPayload, null, 2));

        // 4. Crear link de pago en Wompi
        try {
            const wompiResponse = await axios.post(
                `${WOMPI_CONFIG.getApiUrl()}/payment_links`,
                wompiPayload,
                { 
                    headers: { 
                        'Authorization': `Bearer ${WOMPI_CONFIG.PRIVATE_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!wompiResponse.data?.data?.id) {
                throw new Error('Respuesta inválida de Wompi');
            }

            // 5. Actualizar pago con ID del link
            await nuevoPago.update({
                id_transaccion_wompi: wompiResponse.data.data.id,
                url_redireccion_banco: `https://checkout.wompi.co/l/${wompiResponse.data.data.id}`
            }, { transaction });

            // 6. Confirmar transacción
            await transaction.commit();

            // 7. Enviar respuesta
            return res.json({
                success: true,
                referencia: referencia,
                link_id: wompiResponse.data.data.id,
                redirect_url: `https://checkout.wompi.co/l/${wompiResponse.data.data.id}`
            });

        } catch (wompiError) {
            // Rollback y manejo de error específico de Wompi
            await transaction.rollback();
            console.error('Error de Wompi:', wompiError.response?.data || wompiError.message);
            return res.status(422).json({
                success: false,
                error: 'Error al crear el link de pago en Wompi',
                details: wompiError.response?.data || wompiError.message
            });
        }

    } catch (error) {
        // Rollback y manejo de error general
        await transaction.rollback();
        console.error('Error general:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const manejarResultadoPago = async (req = request, res = response) => {
    const { referencia } = req.params;

    try {
        const pago = await Pago.findOne({
            where: { referencia_pago_interna: referencia }
        });

        if (!pago) {
            return res.status(404).json({
                success: false,
                error: 'Pago no encontrado'
            });
        }

        // Consultar el estado actual en Wompi si el pago está pendiente
        if (pago.estado === 'PENDIENTE' && pago.id_transaccion_wompi) {
            try {
                const wompiResponse = await axios.get(
                    `${WOMPI_CONFIG.getApiUrl()}/transactions/${pago.id_transaccion_wompi}`,
                    { headers: { 'Authorization': `Bearer ${WOMPI_CONFIG.PRIVATE_KEY}` } }
                );

                if (wompiResponse.data?.data) {
                    const estadosWompi = {
                        APPROVED: 'APROBADO',
                        DECLINED: 'RECHAZADO',
                        VOIDED: 'ANULADO',
                        ERROR: 'ERROR'
                    };

                    const nuevoEstado = estadosWompi[wompiResponse.data.data.status] || pago.estado;
                    
                    if (nuevoEstado !== pago.estado) {
                        await pago.update({
                            estado: nuevoEstado,
                            datos_respuesta_agregador: wompiResponse.data.data
                        });
                    }
                }
            } catch (wompiError) {
                console.error('Error consultando estado en Wompi:', wompiError);
            }
        }

        // Devolver la información del pago
        res.json({
            success: true,
            pago: {
                referencia: pago.referencia_pago_interna,
                estado: pago.estado,
                monto: pago.monto,
                metodo_pago: pago.metodo_pago,
                fecha_creacion: pago.fecha_creacion,
                datos_cliente: pago.datos_cliente,
                items: pago.items
            }
        });

    } catch (error) {
        console.error('Error manejando resultado del pago:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar el resultado del pago'
        });
    }
};


// Helper para validar formato de documento
const validarFormatoDocumento = (tipo, documento) => {
    const formatos = {
        'CC': /^\d{8,10}$/, // 8-10 dígitos
        'CE': /^[A-Za-z0-9]{3,12}$/, // 3-12 caracteres alfanuméricos
        'NIT': /^\d{9,11}(-\d{1})?$/, // 9-11 dígitos con dígito de verificación opcional
        'PP': /^[A-Za-z0-9]{6,15}$/ // 6-15 caracteres alfanuméricos
    };

    return formatos[tipo]?.test(documento) ?? false;
};

// --- CONSULTAR ESTADO PAGO PSE ---
const consultarEstadoPagoPSE = async (req = request, res = response) => {
    const { referencia } = req.params;

    try {
        const pago = await Pago.findOne({
            where: { 
                referencia_pago_interna: referencia,
                metodo_pago: 'PSE'
            }
        });

        if (!pago) {
            return res.status(404).json({
                success: false,
                error: 'Pago PSE no encontrado'
            });
        }

        // Si el pago está pendiente, consultar estado en Wompi
        if (pago.estado === 'PENDIENTE' && pago.referencia_agregador) {
            try {
                const wompiResponse = await axios.get(
                    `${WOMPI_CONFIG.getApiUrl()}/transactions/${pago.referencia_agregador}`,
                    { headers: { 'Authorization': `Bearer ${WOMPI_CONFIG.PRIVATE_KEY}` } }
                );

                if (wompiResponse.data?.data) {
                    const estadosWompi = {
                        APPROVED: 'APROBADO',
                        DECLINED: 'RECHAZADO',
                        VOIDED: 'ANULADO',
                        ERROR: 'ERROR'
                    };

                    const nuevoEstado = estadosWompi[wompiResponse.data.data.status] || pago.estado;
                    
                    if (nuevoEstado !== pago.estado) {
                        await pago.update({
                            estado: nuevoEstado,
                            datos_respuesta_agregador: wompiResponse.data.data
                        });
                    }
                }
            } catch (wompiError) {
                console.error('Error consultando estado en Wompi:', wompiError);
                // No fallamos la petición principal si hay error consultando Wompi
            }
        }

        res.json({
            success: true,
            pago: {
                referencia: pago.referencia_pago_interna,
                estado: pago.estado,
                monto: pago.monto,
                banco: pago.banco_pse,
                fecha_creacion: pago.fecha_creacion,
                url_banco: pago.url_redireccion_banco,
                datos_cliente: pago.datos_cliente
            }
        });

    } catch (error) {
        console.error('Error consultando estado del pago PSE:', error);
        res.status(500).json({
            success: false,
            error: 'Error al consultar el estado del pago PSE'
        });
    }
};

// --- RECIBIR WEBHOOK DE WOMPI ---
const recibirWebhookWompi = async (req = request, res = response) => {
    const event = req.body;
    console.log('Webhook Wompi recibido:', JSON.stringify(event, null, 2));

    // 1. Verificar firma del webhook
    try {
        const signature = event.signature?.checksum;
        const timestamp = event.timestamp;
        const eventData = event.data?.transaction;

        if (!signature || !timestamp || !eventData) {
            throw new Error('Datos del webhook incompletos');
        }

        const stringToSign = `${eventData.reference}${eventData.id}${eventData.amount_in_cents}${eventData.status}${timestamp}${WOMPI_CONFIG.EVENTS_SECRET}`;
        const calculatedSignature = crypto.createHash('sha256').update(stringToSign).digest('hex');

        if (calculatedSignature !== signature) {
            throw new Error('Firma del webhook inválida');
        }

    } catch (error) {
        console.error('Error validando webhook:', error);
        return res.status(400).json({ error: 'Webhook inválido' });
    }

    // 2. Procesar el evento
    const transaction = await sequelize.transaction();

    try {
        const eventData = event.data.transaction;
        const pago = await Pago.findOne({
            where: { referencia_pago_interna: eventData.reference },
            transaction
        });

        if (!pago) {
            throw new Error(`Pago no encontrado: ${eventData.reference}`);
        }

        // Mapear estado de Wompi a nuestro sistema
        const estadosWompi = {
            APPROVED: 'APROBADO',
            DECLINED: 'RECHAZADO',
            VOIDED: 'ANULADO',
            ERROR: 'ERROR'
        };

        const nuevoEstado = estadosWompi[eventData.status] || 'PENDIENTE';

        // Actualizar pago
        await pago.update({
            estado: nuevoEstado,
            datos_respuesta_agregador: eventData
        }, { transaction });

        // Si el pago fue aprobado, crear la venta
        if (nuevoEstado === 'APROBADO') {
            // Crear la venta
            const venta = await Venta.create({
                id_usuario: pago.id_usuario,
                fecha_venta: new Date(),
                total_venta: pago.monto / 100, // Convertir de centavos a pesos
                estado: 'COMPLETADA',
                metodo_pago: 'PSE',
                referencia_pago: pago.referencia_pago_interna
            }, { transaction });

            // Crear los detalles de la venta
            for (const item of pago.items) {
                // Actualizar el stock del producto
                const producto = await Producto.findByPk(item.id_producto, { transaction });
                if (!producto) {
                    throw new Error(`Producto no encontrado: ${item.id_producto}`);
                }

                if (producto.stock < item.cantidad) {
                    throw new Error(`Stock insuficiente para ${producto.nombre}`);
                }

                await producto.update({
                    stock: producto.stock - item.cantidad
                }, { transaction });

                // Crear el detalle de la venta
                await DetalleVenta.create({
                    id_venta: venta.id_venta,
                    id_producto: item.id_producto,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    subtotal: item.subtotal / 100 // Convertir de centavos a pesos
                }, { transaction });
            }

            // Actualizar el pago con el ID de la venta
            await pago.update({
                id_venta: venta.id_venta
            }, { transaction });
        }

        await transaction.commit();
        res.json({ success: true });

    } catch (error) {
        await transaction.rollback();
        console.error('Error procesando webhook:', error);
        res.status(500).json({ error: 'Error procesando webhook' });
    }
};

// Consultar estado de un pago
const consultarEstadoPago = async (req = request, res = response) => {
    const { referencia } = req.params;

    try {
        const pago = await Pago.findOne({
            where: { referencia_pago_interna: referencia }
        });

        if (!pago) {
            return res.status(404).json({
                success: false,
                error: 'Pago no encontrado'
            });
        }

        res.json({
            success: true,
            pago: {
                referencia: pago.referencia_pago_interna,
                estado: pago.estado,
                monto: pago.monto,
                fecha_creacion: pago.fecha_creacion,
                metodo_pago: pago.metodo_pago
            }
        });

    } catch (error) {
        console.error('Error consultando estado del pago:', error);
        res.status(500).json({
            success: false,
            error: 'Error al consultar el estado del pago'
        });
    }
};

module.exports = {
    manejarResultadoPago,
    obtenerBancosPSE,
    iniciarPagoPSE,
    recibirWebhookWompi,
    consultarEstadoPago,
    consultarEstadoPagoPSE
};