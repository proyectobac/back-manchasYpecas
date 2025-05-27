const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Importamos el módulo fs para manejar el sistema de archivos

// Definimos la ruta de la carpeta uploads
const uploadDir = 'uploads/';

// Verificamos si la carpeta uploads existe, y la creamos si no
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // Creamos la carpeta, con recursive para subcarpetas si fuera necesario
}

// Configuración de almacenamiento temporal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Usamos la variable uploadDir para la carpeta temporal
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-processed${path.extname(file.originalname)}`;
    cb(null, uniqueSuffix);
  },
});

// Filtro de archivo para validar tipos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imágenes (jpg, jpeg, png, gif)'));
  }
};

// Configuración de límites
const limits = {
  fileSize: 1024 * 1024 * 5, // Límite de 5MB
};

// Configuración de Multer
const upload = multer({
  storage,
  fileFilter,
  limits,
});

module.exports = upload;