// Configuración de Wompi
require('dotenv').config();

const WOMPI_CONFIG = {
    // URLs de la API (Sandbox y Producción)
    SANDBOX_URL: 'https://sandbox.wompi.co/v1',
    PRODUCTION_URL: 'https://production.wompi.co/v1',

    // Llaves públicas y privadas
    PUBLIC_KEY: process.env.WOMPI_PUBLIC_KEY,
    PRIVATE_KEY: process.env.WOMPI_PRIVATE_KEY,
    EVENTS_SECRET: process.env.WOMPI_EVENTS_SECRET,

    // URL base para redirecciones (frontend)
    REDIRECT_BASE_URL: process.env.PAYMENT_REDIRECT_BASE_URL || 'http://localhost:3001',

    // Determinar si estamos en modo sandbox o producción
    IS_SANDBOX: process.env.NODE_ENV !== 'production',

    // Obtener la URL base según el ambiente
    getApiUrl() {
        return this.IS_SANDBOX ? this.SANDBOX_URL : this.PRODUCTION_URL;
    },

    // Validar que la configuración esté completa
    validate() {
        const requiredVars = ['PUBLIC_KEY', 'PRIVATE_KEY', 'EVENTS_SECRET'];
        const missing = requiredVars.filter(key => !this[key]);
        
        if (missing.length > 0) {
            throw new Error(`Faltan variables de entorno de Wompi: ${missing.join(', ')}`);
        }
        return true;
    }
};

module.exports = WOMPI_CONFIG; 