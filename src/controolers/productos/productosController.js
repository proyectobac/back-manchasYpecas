const { response } = require('express');
const { Op } = require('sequelize');
const fs = require('fs'); // Necesario para borrar el archivo temporal de Multer
const path = require('path'); // Para construir rutas si es necesario (aunque menos ahora)
const Producto = require('../../models/productos/productosModel');
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
    // Datos de texto del formulario
    const { nombre, descripcion, categoria, estado } = req.body;
    let cloudinaryResult = null;
    let createdProductoItem = null;

    try {
        // 1. Crear el producto SIN la URL de la foto inicialmente
        createdProductoItem = await Producto.create({
            nombre,
            descripcion,
            categoria,
            estado: estado || 'Activo',
            foto: null, // Empezamos con null
        });

        // 2. Si se subió un archivo (Multer lo puso en req.file)
        if (req.file) {
            try {
                // Subir a Cloudinary
                cloudinaryResult = await uploadToCloudinary(req.file.path, 'producto_images'); // Usa la carpeta correcta

                // Actualizar el producto recién creado con la URL de Cloudinary
                createdProductoItem.foto = cloudinaryResult.secure_url;
                await createdProductoItem.save(); // Guardar el cambio en la BD
                console.log(`Producto ${createdProductoItem.id} actualizado con URL de Cloudinary.`);

            } catch (cloudinaryError) {
                // Si falla Cloudinary, el producto ya existe en la BD sin foto.
                // Podrías decidir borrarlo o dejarlo. Por ahora, solo logueamos y respondemos.
                console.error(`Fallo al subir/actualizar foto para producto ${createdProductoItem?.id}:`, cloudinaryError);
                // NO relanzamos el error aquí para que la respuesta 201 (con producto sin foto) se envíe.
                // O podrías responder con un error 500 específico.
                // Alternativa: Borrar el producto creado si la subida falla.
                // await createdProductoItem.destroy(); throw cloudinaryError;
            }
        }

        // 3. Responder con éxito (con o sin URL de foto actualizada)
        res.status(201).json({
            message: 'Producto creado exitosamente' + (cloudinaryResult ? ' con imagen.' : '.'),
            producto: createdProductoItem, // Devuelve el producto (con o sin foto)
        });

    } catch (error) {
        // Error al crear en la BD (antes de intentar subir foto)
        // Asegurarse de que si Multer creó un archivo temporal, se borre.
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, (err) => { if(err) console.error("Error borrando tmp tras fallo BD:", err); });
        }

        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(e => ({ field: e.path, message: e.message }));
            return res.status(400).json({ message: 'Error de validación', errors });
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Ya existe un producto con este nombre' });
        }
        console.error('Error al crear el producto (BD):', error);
        res.status(500).json({ message: 'Error interno al crear el producto' });
    }
};

// === ACTUALIZAR DATOS (UPDATE) - Adaptado para Cloudinary ===
const putProducto = async (req, res = response) => {
    const { id } = req.params;
    const { nombre, descripcion, categoria, estado } = req.body;
    let datosParaActualizar = { nombre, descripcion, categoria, estado };
    let oldPublicId = null;
    let producto = null;

    try {
        // 1. Buscar el producto existente
        producto = await Producto.findByPk(id);
        if (!producto) {
            // Si se subió un archivo pero el producto no existe, borrar archivo temporal
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                 fs.unlink(req.file.path, (err) => { if (err) console.error("Error borrando tmp para producto no encontrado:", err); });
            }
            return res.status(404).json({ message: `No se encontró un producto con ID ${id}` });
        }

        // 2. Si se subió un NUEVO archivo
        if (req.file) {
            try {
                // Guardar ID de la imagen antigua de Cloudinary (si existe)
                if (producto.foto) {
                    oldPublicId = getPublicIdFromUrl(producto.foto);
                }

                // Subir la nueva imagen a Cloudinary
                const cloudinaryResult = await uploadToCloudinary(req.file.path, 'producto_images');

                // Añadir la nueva URL de Cloudinary a los datos a actualizar
                datosParaActualizar.foto = cloudinaryResult.secure_url;

            } catch (cloudinaryError) {
                 // Si Cloudinary falla, no actualizamos la foto, pero podemos continuar actualizando el resto
                 console.error(`Fallo al subir nueva foto para producto ${id}, se actualizarán solo los datos de texto:`, cloudinaryError);
                 // NO añadir datosParaActualizar.foto
                 // El archivo temporal ya se borra dentro de uploadToCloudinary
            }
        }

        // 3. Actualizar el producto en la BD (con o sin nueva URL de foto)
        await producto.update(datosParaActualizar);

        // 4. Si se subió una foto NUEVA con éxito Y había una antigua, borrar la antigua de Cloudinary
        if (req.file && datosParaActualizar.foto && oldPublicId) { // Verifica que la nueva url se haya añadido
             await deleteFromCloudinary(oldPublicId);
        }

        // 5. Responder con éxito
        res.json({
            message: `Producto con ID ${id} actualizado exitosamente`,
            producto, // Devuelve el producto actualizado
        });

    } catch (error) {
        // Error al actualizar en BD
        // Si falló la BD, pero se subió un archivo nuevo (y no se asignó a datosParaActualizar.foto por error previo)
        // debemos asegurarnos que el temporal se borre (aunque uploadToCloudinary ya lo intenta)
         if (req.file && req.file.path && fs.existsSync(req.file.path)) {
             fs.unlink(req.file.path, (err) => { if(err) console.error("Error borrando tmp tras fallo BD update:", err); });
         }

        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(e => ({ field: e.path, message: e.message }));
            return res.status(400).json({ message: 'Error de validación', errors });
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Ya existe otro producto con este nombre' });
        }
        console.error('Error al actualizar el producto (BD):', error);
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