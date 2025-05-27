const axios = require('axios');
require('dotenv').config();

async function obtenerBancosPSE() {
    try {
        console.log('Obteniendo lista de bancos PSE...');
        
        const response = await axios.get('http://localhost:3001/api/pagos/bancos-pse');
        
        console.log('\nRespuesta:');
        console.log('--------------------------------');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('--------------------------------');

    } catch (error) {
        console.error('\nError al obtener bancos PSE:');
        console.error('--------------------------------');
        console.error(error.response?.data || error.message);
        console.error('--------------------------------');
    }
}

// Ejecutar la prueba
obtenerBancosPSE(); 