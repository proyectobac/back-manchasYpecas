const { response } = require('express');
const { Op } = require('sequelize');
const fs = require('fs'); // Necesario para borrar el archivo temporal de Multer
const path = require('path'); // Para construir rutas si es necesario (aunque menos ahora)
const Producto = require('../../models/productos/productosModel');
const DetallesCompra = require('../../models/detalleCompra/detallesCompraModel');
const cloudinary = require('../../../cloudinaryConfig'); // CONFIRMA RUTA

// --- Helper para obtener Public ID (similar al de imageController) ---
const getPublicIdFromUrl = (imageUrl) => {
    try {
        // Asegurarse que la URL sea válida y contenga el patrón de Cloudinary
        if (!imageUrl || !imageUrl.includes('/upload/')) {
            return null;
        }
        const uploadPart = imageUrl.split('/upload/')[1];
        const pathWithoutVersion = uploadPart.replace(/^v\d+\//, '');
        const lastDotIndex = pathWithoutVersion.lastIndexOf('.');
        if (lastDotIndex === -1) return null; // Sin extensión
        return decodeURIComponent(pathWithoutVersion.substring(0, lastDotIndex));
    } catch (error) {
        console.error("Error extrayendo public_id:", imageUrl, error);
        return null;
    }
};

// --- Helper para subir a Cloudinary y borrar temporal ---
// Simplificado para usar dentro del controlador
const uploadToCloudinary = async (filePath, folderName) => {
    try {
        console.log(`Subiendo ${filePath} a Cloudinary/${folderName}...`);
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folderName,
            transformation: [{ width: 1024, height: 1024, crop: 'limit' }],
            quality: 'auto',
            fetch_format: 'auto',
        });
        console.log(`Cloudinary upload exitoso: ${result.public_id}`);
        // Borrar archivo temporal DESPUÉS de subir
        fs.unlink(filePath, (err) => {
             if (err) console.error(`Error al borrar archivo temporal ${filePath}:`, err);
             else console.log(`Archivo temporal ${filePath} eliminado.`);
        });
        return result; // Devuelve el objeto completo de Cloudinary
    } catch (error) {
        console.error(`Error al subir a Cloudinary (${filePath}):`, error);
        // Intentar borrar el archivo temporal incluso si la subida falla
        fs.unlink(filePath, (err) => { if (err) console.error(`Error borrando tmp ${filePath} tras fallo Cloudinary:`, err); });
        throw error; // Relanzar para manejo en el controlador
    }
};

// --- Helper para borrar de Cloudinary ---
const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return; // No hacer nada si no hay publicId
    try {
        console.log(`Eliminando ${publicId} de Cloudinary...`);
        await cloudinary.uploader.destroy(publicId);
        console.log(`Cloudinary: ${publicId} eliminado.`);
    } catch (error) {
        // Loguear error pero no necesariamente fallar la operación principal
        console.error(`Error al eliminar ${publicId} de Cloudinary:`, error);
    }
};


// === OBTENER DATOS (READ) - Sin cambios respecto a la versión anterior ===
const getProductos = async (req, res = response) => {
    // ... (código igual a la versión anterior con filtros opcionales) ...
     try {
        const { categoria, estado } = req.query;
        const whereClause = {};
        if (categoria) whereClause.categoria = categoria;
        if (estado) whereClause.estado = estado;

        const { count, rows } = await Producto.findAndCountAll({ where: whereClause });
        res.json({ total: count, productos: rows });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ message: 'Error interno al obtener los productos' });
    }
};

const getProducto = async (req, res = response) => {
    // ... (código igual) ...
     const { id } = req.params;
    try {
        const producto = await Producto.findByPk(id);
        if (!producto) {
            return res.status(404).json({ message: `No se encontró un producto con ID ${id}` });
        }
        res.json(producto);
    } catch (error) {
        console.error('Error al obtener el producto:', error);
        res.status(500).json({ message: 'Error interno al obtener el producto' });
    }
};

// === CREAR DATOS (CREATE) - Adaptado para Cloudinary ===
const postProducto = async (req, res = response) => {
    const { nombre, descripcion, categoria, estado, precioVenta, stock } = req.body;
    
    try {
        let fotoUrl = null;

        // Si hay un archivo subido, procesarlo con cloudinary
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'producto_images',
                use_filename: true,
                unique_filename: false,
            });
            fotoUrl = result.secure_url;
            fs.unlinkSync(req.file.path); // Eliminar archivo temporal
        }

        // Crear el producto con todos los datos, incluyendo la URL de la foto
        const createdProductoItem = await Producto.create({
            nombre,
            descripcion,
            categoria,
            estado: estado || 'Activo',
            precioVenta: precioVenta || 0,
            stock: stock || 0,
            foto: fotoUrl
        });

        res.status(201).json({
            message: 'Producto creado exitosamente',
            producto: createdProductoItem
        });

    } catch (error) {
        console.error('Error al crear el producto:', error);
        
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(e => ({ field: e.path, message: e.message }));
            return res.status(400).json({ message: 'Error de validación', errors });
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Ya existe un producto con este nombre' });
        }
        
        res.status(500).json({ message: 'Error interno al crear el producto' });
    }
};

// === ACTUALIZAR DATOS (UPDATE) - Adaptado para Cloudinary ===
const putProducto = async (req, res = response) => {
    const { id } = req.params;
    const { nombre, descripcion, categoria, estado, precioCosto } = req.body;
    let datosParaActualizar = { nombre, descripcion, categoria, estado };
    let oldPublicId = null;
    let producto = null;

    try {
        // 1. Buscar el producto existente
        producto = await Producto.findByPk(id);
        if (!producto) {
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                fs.unlink(req.file.path, (err) => { if (err) console.error("Error borrando tmp para producto no encontrado:", err); });
            }
            return res.status(404).json({ message: `No se encontró un producto con ID ${id}` });
        }

        // 2. Si se está actualizando el precio de costo, calcular nuevo precio de venta
        if (precioCosto !== undefined) {
            // Buscar el último detalle de compra para obtener el margen
            const ultimaCompra = await DetallesCompra.findOne({
                where: { id_producto: id },
                order: [['createdAt', 'DESC']]
            });

            if (ultimaCompra && ultimaCompra.margen_aplicado) {
                // Usar la misma fórmula que en comprasController
                // Valor venta = Valor producto / (1 - (Margen / 100))
                const margen = parseFloat(ultimaCompra.margen_aplicado);
                if (margen < 100) {
                    const nuevoPrecioVenta = parseFloat(precioCosto) / (1 - (margen / 100));
                    datosParaActualizar.precioCosto = parseFloat(precioCosto);
                    datosParaActualizar.precioVenta = parseFloat(nuevoPrecioVenta.toFixed(2));
                } else {
                    console.warn(`Margen de ${margen}% es inválido para calcular precio de venta del producto ${id}.`);
                    datosParaActualizar.precioCosto = parseFloat(precioCosto);
                }
            } else {
                // Si no hay compras previas o no hay margen, solo actualizar el precio de costo
                datosParaActualizar.precioCosto = parseFloat(precioCosto);
            }
        }

        // 3. Si se subió un NUEVO archivo
        if (req.file) {
            try {
                if (producto.foto) {
                    oldPublicId = getPublicIdFromUrl(producto.foto);
                }
                const cloudinaryResult = await uploadToCloudinary(req.file.path, 'producto_images');
                datosParaActualizar.foto = cloudinaryResult.secure_url;
            } catch (cloudinaryError) {
                console.error(`Fallo al subir nueva foto para producto ${id}, se actualizarán solo los datos de texto:`, cloudinaryError);
            }
        }

        // 4. Actualizar el producto en la BD
        await producto.update(datosParaActualizar);

        // 5. Si se subió una foto NUEVA con éxito Y había una antigua, borrar la antigua
        if (req.file && datosParaActualizar.foto && oldPublicId) {
            await deleteFromCloudinary(oldPublicId);
        }

        res.json({
            message: `Producto con ID ${id} actualizado exitosamente`,
            producto
        });

    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(e => ({ field: e.path, message: e.message }));
            return res.status(400).json({ message: 'Error de validación', errors });
        }
        res.status(500).json({ message: 'Error interno al actualizar el producto' });
    }
};

// === ACTUALIZACIÓN PARCIAL (PATCH) - Sin cambios ===
const patchProductoEstado = async (req, res = response) => {
    // ... (código igual a la versión anterior) ...
      const { id } = req.params;
    const { estado } = req.body;

    if (!estado || !['Activo', 'Inactivo'].includes(estado)) {
        return res.status(400).json({ message: 'Estado no válido.' });
    }

    try {
        const producto = await Producto.findByPk(id);
        if (!producto) {
            return res.status(404).json({ message: `Producto ID ${id} no encontrado.` });
        }
        await producto.update({ estado });
        res.json({ message: `Estado del producto ID ${id} actualizado a ${estado}`, producto });
    } catch (error) {
        console.error('Error al actualizar estado del producto:', error);
        res.status(500).json({ message: 'Error interno al actualizar estado.' });
    }
};


// === ELIMINAR DATOS (DELETE) - Adaptado para Cloudinary ===
const deleteProducto = async (req, res = response) => {
    const { id } = req.params;
    let publicIdParaBorrar = null;
    let producto = null;

    try {
        // 1. Buscar el producto
        producto = await Producto.findByPk(id);
        if (!producto) {
            return res.status(404).json({ message: `No se encontró un producto con ID ${id}` });
        }

        // 2. Obtener el public_id de Cloudinary ANTES de borrar de la BD
        if (producto.foto) {
            publicIdParaBorrar = getPublicIdFromUrl(producto.foto);
        }

        // 3. Eliminar el registro de la base de datos
        await producto.destroy();

        // 4. Si había un public_id, intentar borrar de Cloudinary
        if (publicIdParaBorrar) {
            await deleteFromCloudinary(publicIdParaBorrar);
        }

        // 5. Responder con éxito
        res.json({ message: `Producto con ID ${id} eliminado exitosamente` });

    } catch (error) {
        // Error al eliminar de la BD (Cloudinary no se intentó borrar o falló)
        console.error('Error al eliminar el producto (BD o Cloudinary):', error);
        res.status(500).json({ message: 'Error interno al eliminar el producto' });
    }
};

// Exportar controladores
module.exports = {
    getProductos,
    getProducto,
    postProducto,
    putProducto,
    patchProductoEstado,
    deleteProducto,
};