// src/routes/uploadRoutes.js (o la ubicación que prefieras)

const express = require('express');
const router = express.Router();

// --- Importaciones ---
// 1. Importa tu controlador de imágenes GENÉRICO
const adminProfileController = require('../../controolers/adminProfileController/adminProfileController'); // <-- AJUSTA ESTA RUTA a donde guardaste el nuevo controlador

// 2. Importa tu middleware de autenticación
const verificarToken = require('../../../middlewares/verificarToken'); // <-- AJUSTA ESTA RUTA a tu middleware

// 3. (Opcional) Importa middlewares de autorización si los necesitas (ej: isAdmin)
// const { isAdmin } = require('../middlewares/auth'); // <-- Descomenta y ajusta si necesitas verificar roles

// --- Definición de Rutas ---

/**
 * @route   POST /api/upload/usuario/foto
 * @desc    Actualizar la foto de perfil de un usuario (Admin, Empleado, Cliente)
 * @access  Privado (Requiere Token)
 * @body    { form-data: { foto: File, id_usuario: number } }
 *
 * Este endpoint reemplaza tus anteriores /admin-profile y /empleado-profile.
 * Llama a `imageController.subirFotoUsuario`, que maneja la subida optimizada
 * a Cloudinary, la actualización del campo 'foto' en el modelo 'Usuario',
 * y la eliminación de la foto antigua.
 */
router.post(
    '/usuario/foto',        // URL del endpoint unificado
    verificarToken,         // Middleware: Verifica que el usuario esté autenticado
    // Aquí podrías añadir más middlewares si necesitas (ej: isAdmin si solo admins pueden cambiar fotos de otros)
    adminProfileController.subirFotoUsuario // Controlador: Usa la función específica para el modelo Usuario
);


/**
 * @route   POST /api/upload/servicio/foto
 * @desc    Actualizar la foto de un servicio
 * @access  Privado (Requiere Token, ¿y Admin?)
 * @body    { form-data: { foto: File, id: number } } // O 'id_servicio' si usas ese nombre
 *
 * (OPCIONAL) Descomenta y usa esta ruta si necesitas actualizar imágenes de Servicios.
 * Asegúrate de que el controlador `subirFotoServicio` esté configurado correctamente
 * y que el nombre del parámetro del ID ('id' o 'id_servicio') coincida
 * con lo que espera `handleFileUpload` en imageController.js.
 */

router.post(
    '/product/foto',
    verificarToken,
    // isAdmin, // Podrías requerir que solo un admin pueda hacer esto
    adminProfileController.subirFotoProducto
);



/**
 * @route   POST /api/upload/empleado/foto
 * @desc    Actualizar la foto en el MODELO EMPLEADO (¡OJO! Modelo Separado)
 * @access  Privado (Requiere Token, ¿y Admin?)
 * @body    { form-data: { foto: File, id_empleado: number } }
 *
 * (OPCIONAL Y SOLO SI ES NECESARIO) Descomenta y usa esta ruta SOLAMENTE si
 * necesitas actualizar el campo 'foto' DENTRO del modelo 'Empleado' y NO el
 * campo 'foto' del modelo 'Usuario' asociado a ese empleado.
 * Si la foto de perfil principal está en 'Usuario', NO uses esta ruta para eso.
 */
/*
router.post(
    '/empleado/foto',
    verificarToken,
    // isAdmin, // Podrías requerir que solo un admin pueda hacer esto
    imageController.subirFotoEmpleado
);
*/


// --- Exportar el router ---
module.exports = router;