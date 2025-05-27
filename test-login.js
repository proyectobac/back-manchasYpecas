const axios = require('axios');
require('dotenv').config();

async function probarLogin() {
    try {
        console.log('Iniciando prueba de login...');
        console.log('URL:', 'http://localhost:3001/api/login');
        console.log('Datos:', {
            correo: "sionbarbershop5@gmail.com",
            contrasena: "12345678S"
        });
        
        const response = await axios.post('http://localhost:3001/api/login', {
            correo: "sionbarbershop5@gmail.com",
            contrasena: "12345678S"
        });
        
        console.log('\nRespuesta del login:');
        console.log('--------------------------------');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('--------------------------------');

        if (response.data.token) {
            console.log('\n✅ Token obtenido con éxito. Agrégalo a tu archivo .env como:');
            console.log(`TEST_TOKEN=${response.data.token}`);
        }

    } catch (error) {
        console.error('\nError al hacer login:');
        console.error('--------------------------------');
        if (error.response) {
            // La petición fue hecha y el servidor respondió con un código de estado
            console.error('Estado:', error.response.status);
            console.error('Datos:', error.response.data);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            // La petición fue hecha pero no se recibió respuesta
            console.error('No se recibió respuesta del servidor');
            console.error(error.request);
        } else {
            // Algo sucedió al configurar la petición
            console.error('Error:', error.message);
        }
        console.error('--------------------------------');
    }
}

// Ejecutar la prueba
probarLogin(); 