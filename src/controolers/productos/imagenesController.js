// src/controolers/productos/imagenesController.js
const fs = require('fs').promises;
const path = require('path');
const Producto = require('../../models/productos/productosModel');

const CATEGORIAS_MAP = {
    'Snacks': 'SNACKS',
    'Aseo': 'HIGIENE',
    'Juguetes': 'JUGUETERIA',
    'Accesorios': 'ACCESORIOS',
    'Comederos': 'COMEDEROS'
};

const getProductosFromImagenes = async (req, res) => {
    console.log("--- Iniciando getProductosFromImagenes (Modo Obtener para Tienda) ---");
    try {
        const imagenesPath = path.join(__dirname, '../../../imagenes');
        const carpetasCategoriasFs = await fs.readdir(imagenesPath);
        const productosPorCategoriaRespuesta = {};

        const todosLosProductosDB = await Producto.findAll({
            // attributes: ['id_producto', 'nombre', 'descripcion', 'categoria', 'foto', 'precioVenta', 'stock', 'estado'] // Puedes seleccionar solo los campos que el frontend necesita
        });
        const productosDBMap = new Map();
        todosLosProductosDB.forEach(p => {
            productosDBMap.set(p.nombre.toLowerCase().trim(), p);
        });

        for (const nombreCarpeta of carpetasCategoriasFs) {
            const rutaCarpeta = path.join(imagenesPath, nombreCarpeta);
            if (!(await fs.stat(rutaCarpeta)).isDirectory()) continue;

            const categoriaModelo = CATEGORIAS_MAP[nombreCarpeta];
            if (!categoriaModelo) {
                console.warn(`  ADVERTENCIA: Carpeta '${nombreCarpeta}' no tiene mapeo en CATEGORIAS_MAP. Omitiendo.`);
                continue;
            }
            
            if (!productosPorCategoriaRespuesta[categoriaModelo]) {
                productosPorCategoriaRespuesta[categoriaModelo] = [];
            }

            const archivosEnCarpeta = await fs.readdir(rutaCarpeta);

            for (const nombreArchivo of archivosEnCarpeta) {
                if (!/\.(jpg|jpeg|png|gif)$/i.test(nombreArchivo)) continue;

                const nombreBaseArchivo = path.parse(nombreArchivo).name;
                const nombreProductoDesdeArchivo = nombreBaseArchivo.replace(/-/g, ' ').trim().toLowerCase();
                const productoEncontradoDB = productosDBMap.get(nombreProductoDesdeArchivo);

                if (productoEncontradoDB) {
                    // ¡CAMBIO CRUCIAL AQUÍ!
                    // Construir la ruta completa que el frontend usará para llamar al endpoint servirImagen
                    // Si imagenesRoutes se monta en '/api/imagenes', la ruta es '/api/imagenes/imagen/...'
                    const rutaFotoParaServir = `/api/imagenes/imagen/${nombreCarpeta}/${nombreArchivo}`;

                    // Actualizar el campo 'foto' del producto encontrado con la ruta correcta
                    // Esto NO modifica la base de datos, solo el objeto que se envía en la respuesta JSON
                    const productoParaFrontend = {
                        ...productoEncontradoDB.get({ plain: true }), // Obtener objeto plano del modelo
                        foto: rutaFotoParaServir, // Sobrescribir/Añadir la ruta de la foto servible
                        categoria: categoriaModelo // Asegurar que la categoría sea la de la carpeta para la agrupación
                    };
                    productosPorCategoriaRespuesta[categoriaModelo].push(productoParaFrontend);
                } else {
                    // Si quieres que los productos que están en las carpetas pero NO en la BD
                    // se muestren (con datos por defecto), puedes añadirlos aquí.
                    // PERO esto haría que el frontend muestre productos que no tienen precio/stock real.
                    // Por ahora, nos enfocamos en mostrar los que SÍ están en la BD.
                    console.log(`    ADVERTENCIA: Archivo '${nombreArchivo}' (nombre: '${nombreProductoDesdeArchivo}') no encontró producto en BD.`);
                }
            }
        }
        
        for (const cat in productosPorCategoriaRespuesta) {
            if (productosPorCategoriaRespuesta[cat].length === 0) {
                delete productosPorCategoriaRespuesta[cat];
            }
        }

        res.json({
            success: true,
            productos: productosPorCategoriaRespuesta
        });

    } catch (error) {
        console.error('Error GENERAL al obtener productos desde imágenes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener productos desde imágenes',
            details: error.message
        });
    }
};

const servirImagen = async (req, res) => {
    try {
        const { categoria, imagen } = req.params;
        const rutaImagen = path.join(__dirname, '../../../imagenes', categoria, imagen);
        await fs.access(rutaImagen);
        res.sendFile(rutaImagen);
    } catch (error) {
        res.status(404).send('Imagen no encontrada');
    }
};

module.exports = {
    getProductosFromImagenes,
    servirImagen
};