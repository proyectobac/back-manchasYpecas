require('dotenv').config();
const WOMPI_CONFIG = require('./src/config/wompiConfig');

console.log('Verificando configuración de Wompi...');
console.log('----------------------------------------');
console.log('Variables de entorno:');
console.log('WOMPI_PUBLIC_KEY:', process.env.WOMPI_PUBLIC_KEY ? '✓ Presente' : '✗ No encontrada');
console.log('WOMPI_PRIVATE_KEY:', process.env.WOMPI_PRIVATE_KEY ? '✓ Presente' : '✗ No encontrada');
console.log('WOMPI_EVENTS_SECRET:', process.env.WOMPI_EVENTS_SECRET ? '✓ Presente' : '✗ No encontrada');
console.log('PAYMENT_REDIRECT_BASE_URL:', process.env.PAYMENT_REDIRECT_BASE_URL || '✗ No encontrada');
console.log('\nConfiguración cargada:');
console.log('PUBLIC_KEY:', WOMPI_CONFIG.PUBLIC_KEY ? '✓ Configurada' : '✗ No configurada');
console.log('PRIVATE_KEY:', WOMPI_CONFIG.PRIVATE_KEY ? '✓ Configurada' : '✗ No configurada');
console.log('EVENTS_SECRET:', WOMPI_CONFIG.EVENTS_SECRET ? '✓ Configurada' : '✗ No configurada');
console.log('REDIRECT_BASE_URL:', WOMPI_CONFIG.REDIRECT_BASE_URL);
console.log('IS_SANDBOX:', WOMPI_CONFIG.IS_SANDBOX ? 'Sí' : 'No');
console.log('API_URL:', WOMPI_CONFIG.getApiUrl());
console.log('----------------------------------------');

try {
    WOMPI_CONFIG.validate();
    console.log('✓ La configuración es válida');
} catch (error) {
    console.error('✗ Error en la configuración:', error.message);
    console.error('\nPor favor, asegúrate de que las siguientes variables estén configuradas en el archivo .env:');
    console.error('WOMPI_PUBLIC_KEY=tu_llave_publica');
    console.error('WOMPI_PRIVATE_KEY=tu_llave_privada');
    console.error('WOMPI_EVENTS_SECRET=tu_secret_de_eventos');
    console.error('PAYMENT_REDIRECT_BASE_URL=http://tu-frontend.com');
} 