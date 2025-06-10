const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'manchasYpecas',
    dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false
        } : false
    },
    logging: false // Desactivar logs SQL en producción
});

// Función para intentar la conexión
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Conexión a la base de datos exitosa.");
        
        // Solo sincronizar en desarrollo
        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync();
            console.log("✅ Tablas sincronizadas con éxito.");
        }
    } catch (error) {
        console.error("❌ Error en la base de datos:", error.message);
    }
};

// Ejecutar la prueba de conexión
testConnection();

module.exports = { sequelize };
