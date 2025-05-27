// controllers/imageController.js (o como lo llames)

const fs = require('fs');
const path = require('path');
const upload = require('../../../middlewares/multer'); // CONFIRMA RUTA a tu config de Multer
const cloudinary = require('../../../cloudinaryConfig'); // CONFIRMA RUTA a tu config de Cloudinary

// --- Importa TODOS los modelos que usarán subida de fotos ---
const Usuario = require('../../models/usuarios/usuariosModel');
const Empleado = require('../../models/empleados/empleadosModel');
const Producto = require('../../models/productos/productosModel'); // Corregido a Servicios (plural) si así se llama el modelo

// --- Función Auxiliar para extraer Public ID (Revisada para robustez) ---
/**
 * Extrae el public_id de una URL de Cloudinary para poder eliminarla.
 * @param {string} imageUrl La URL completa de Cloudinary.
 * @returns {string|null} El public_id (incluyendo carpeta si existe) o null.
 */
const getPublicIdFromUrl = (imageUrl) => {
    try {
        if (!imageUrl || !imageUrl.includes('/upload/')) {
            // console.warn("getPublicIdFromUrl: URL inválida o no contiene '/upload/'", imageUrl);
            return null; // No es una URL válida o no tiene el formato esperado
        }
        // Ejemplo: https://res.cloudinary.com/cloud_name/image/upload/v167888/folder/image.jpg
        // Necesitamos "folder/image"

        // 1. Dividir por '/upload/' y tomar la segunda parte
        const uploadPart = imageUrl.split('/upload/')[1]; // v167888/folder/image.jpg

        // 2. Quitar la posible versión (ej: v123456789/) al inicio
        const pathWithoutVersion = uploadPart.replace(/^v\d+\//, ''); // folder/image.jpg

        // 3. Quitar la extensión al final (ej: .jpg, .png, .webp)
        const lastDotIndex = pathWithoutVersion.lastIndexOf('.');
        if (lastDotIndex === -1) {
            console.warn("getPublicIdFromUrl: No se encontró extensión en:", pathWithoutVersion);
            return null; // No se pudo encontrar la extensión
        }
        const publicId = pathWithoutVersion.substring(0, lastDotIndex); // folder/image

        // Decodificar por si hay caracteres especiales en el nombre de la carpeta/archivo
        return decodeURIComponent(publicId);

    } catch (error) {
        console.error("Error crítico extrayendo public_id de URL:", imageUrl, error);
        return null;
    }
};

// --- Función GENÉRICA para Subir/Actualizar/Optimizar/Borrar Imagen ---
/**
 * Sube una imagen optimizada a Cloudinary para un registro específico,
 * actualiza el campo 'foto' en la base de datos y elimina la imagen anterior.
 *
 * @param {object} model - El modelo de Sequelize (Usuario, Empleado, Servicios).
 * @param {number|string} recordId - El ID del registro a actualizar (pk).
 * @param {string} filePath - La ruta al archivo temporal subido por Multer.
 * @param {string} idFieldName - El nombre del campo de ID en el modelo (ej: 'id_usuario', 'id_empleado', 'id').
 * @param {string} folderName - La carpeta en Cloudinary donde guardar (ej: 'profile_images', 'service_images').
 * @returns {Promise<string>} - Promesa que resuelve con la URL segura de la NUEVA imagen.
 * @throws {Error} - Si el registro no se encuentra, la subida falla, etc.
 */
const _subirActualizarImagenGenerico = async (model, recordId, filePath, idFieldName, folderName) => {
    let record;
    try {
        // 1. Buscar el registro específico usando el modelo y ID correctos
        record = await model.findByPk(recordId);

        if (!record) {
            // Si no se encuentra, borrar el archivo temporal y lanzar error
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            throw new Error(`Registro de ${model.name} con ID ${recordId} no encontrado.`);
        }

        // 2. Guardar la URL de la imagen antigua (¡AQUÍ USAMOS EL CAMPO 'foto'!)
        const oldImageUrl = record.foto; // ¡Esta es la URL que necesitamos!
        let oldPublicId = null;
        if (oldImageUrl) {
            oldPublicId = getPublicIdFromUrl(oldImageUrl);
            if (!oldPublicId) {
                console.warn(`No se pudo extraer public_id de la URL antigua: ${oldImageUrl}. No se intentará borrar.`);
            }
        }

        // 3. Subir la NUEVA imagen a Cloudinary con OPTIMIZACIONES
        console.log(`Subiendo nueva imagen para ${model.name} ID ${recordId} a carpeta ${folderName}`);
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folderName, // Usar la carpeta especificada
            // --- Optimizaciones (Tus requisitos) ---
            transformation: [
                // 1. Limitar tamaño para que no sea gigante (ajusta 1024 si quieres otro tamaño)
                { width: 1024, height: 1024, crop: 'limit' }
            ],
            // 2. Comprimir automáticamente para reducir peso (calidad vs tamaño)
            quality: 'auto',
            // 3. Permitir a Cloudinary entregar el mejor formato (WebP, AVIF) al navegador
            fetch_format: 'auto'
            // Importante: No fijar 'use_filename' ni 'unique_filename: false'
            // Dejamos que Cloudinary genere un public_id único para evitar colisiones y facilitar borrado.
        });
        console.log(`Imagen subida: ${result.public_id}, URL: ${result.secure_url}`);

        // 4. Eliminar el archivo temporal local (¡DESPUÉS de subir a Cloudinary!)
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Archivo temporal ${filePath} eliminado.`);
        }

        // 5. Actualizar el campo 'foto' del registro en la BD con la NUEVA URL
        record.foto = result.secure_url; // Guardamos la URL optimizada
        await record.save();
        console.log(`Base de datos actualizada para ${model.name} ID ${recordId}.`);

        // 6. Eliminar la imagen ANTIGUA de Cloudinary (usando el public_id extraído)
        if (oldPublicId) {
            try {
                console.log(`Intentando eliminar imagen anterior de Cloudinary: ${oldPublicId}`);
                await cloudinary.uploader.destroy(oldPublicId);
                console.log(`Imagen anterior (${oldPublicId}) eliminada con éxito de Cloudinary.`);
            } catch (deleteError) {
                console.error(`Error al eliminar imagen anterior (${oldPublicId}) de Cloudinary:`, deleteError.message || deleteError);
                // Logueamos el error pero no detenemos el proceso (la nueva imagen ya está subida y guardada)
            }
        }

        // 7. Devolver la nueva URL segura
        return result.secure_url;

    } catch (error) {
        // Manejo de errores general: asegurar limpieza del archivo temporal
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log(`Archivo temporal ${filePath} eliminado en bloque catch.`);
            } catch (unlinkErr) {
                console.error("Error al intentar eliminar archivo local en bloque catch:", unlinkErr);
            }
        }
        // Relanzar el error para que el controlador de ruta lo maneje
        console.error(`Error en _subirActualizarImagenGenerico para ${model?.name || 'modelo desconocido'}:`, error);
        throw error; // Importante para que la respuesta HTTP sea correcta
    }
};

// --- Controladores de Ruta Específicos (Endpoints) ---

// Middleware genérico para simplificar los controladores de ruta
const handleFileUpload = (model, idParamName, idFieldName, folderName, entityName) => {
    return (req, res) => {
        upload.single('foto')(req, res, async (err) => {
            // 1. Manejo de errores de Multer
            if (err) {
                console.error(`Error de Multer para ${entityName}:`, err.message);
                if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ error: `Error al subir archivo: ${err.message}` });
            }

            // 2. Verificar que se subió archivo
            if (!req.file) {
                return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
            }

            // 3. Obtener el ID del registro (puede venir de params o body)
            const recordId = req.params[idParamName] || req.body[idParamName];
            if (!recordId) {
                console.warn(`Falta el ID (${idParamName}) para la subida de ${entityName}.`);
                if (req.file.path && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ error: `Falta el ID (${idParamName}) del ${entityName}.` });
            }

            // 4. Llamar a la función genérica
            try {
                const nuevaUrl = await _subirActualizarImagenGenerico(
                    model,
                    recordId,
                    req.file.path,
                    idFieldName, // Pasamos el nombre del campo PK
                    folderName   // Pasamos la carpeta de Cloudinary
                );

                res.json({
                    message: `Imagen de ${entityName} actualizada con éxito.`,
                    filePath: nuevaUrl // Devolvemos la nueva URL de Cloudinary
                });

            } catch (error) {
                console.error(`Error final procesando imagen para ${entityName} ID ${recordId}:`, error.message);
                // Determinar código de estado basado en el error
                const status = error.message.includes('no encontrado') ? 404 : 500;
                res.status(status).json({ error: error.message || `Error interno al procesar la imagen de ${entityName}` });
            }
        });
    };
};

// --- Exportaciones para las rutas ---
// Define aquí los controladores específicos usando el manejador genérico

// Para Usuarios (Admin/Empleado/Cliente si todos usan el modelo Usuario)
// Asume que el ID viene en req.body.id_usuario
// Guarda en la carpeta 'profile_images'
const subirFotoUsuario = handleFileUpload(Usuario, 'id_usuario', 'id_usuario', 'profile_images', 'usuario');

// Para Empleados (si usas el modelo Empleado y quieres un endpoint separado)
// Asume que el ID viene en req.body.id_empleado
// Guarda en la carpeta 'employee_images' (o 'profile_images' si prefieres)
const subirFotoEmpleado = handleFileUpload(Empleado, 'id_empleado', 'id_empleado', 'employee_images', 'empleado');

// Para Servicios
// Asume que el ID viene en req.body.id_servicio (o 'id' si usas solo 'id')
// Guarda en la carpeta 'service_images'
const subirFotoProducto = handleFileUpload(Producto, 'id_servicio', 'id_servicio', 'producto_images', 'producto');


module.exports = {
    subirFotoUsuario,
    subirFotoEmpleado,
    subirFotoProducto,
    // Puedes añadir más exportaciones para otros modelos si es necesario
};






