const fetch = require('node-fetch');
require('dotenv').config();

async function probarLogin() {
    const datosLogin = {
        nombre_usuario: "Felicianom",
        contrasena: "123456AA"
    };

    try {
        console.log('Iniciando prueba de login...');
        console.log('Datos a enviar:', JSON.stringify(datosLogin, null, 2));
        
        const response = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosLogin)
        });

        const data = await response.json();
        
        console.log('\nRespuesta del servidor:');
        console.log('--------------------------------');
        console.log('Estado:', response.status);
        console.log('Datos:', JSON.stringify(data, null, 2));
        console.log('--------------------------------');

        if (data.token) {
            console.log('\n✅ Token obtenido con éxito. Agrégalo a tu archivo .env como:');
            console.log(`TEST_TOKEN=${data.token}`);
        }

        // JSON para Postman
        console.log('\nPara probar en Postman:');
        console.log('--------------------------------');
        console.log('URL: http://localhost:3001/api/login');
        console.log('Método: POST');
        console.log('Headers:');
        console.log('{');
        console.log('  "Content-Type": "application/json"');
        console.log('}');
        console.log('\nBody (raw JSON):');
        console.log(JSON.stringify(datosLogin, null, 2));
        console.log('--------------------------------');

    } catch (error) {
        console.error('\nError al hacer login:');
        console.error('--------------------------------');
        console.error(error);
        console.error('--------------------------------');

        // Aún así, mostrar la información para Postman
        console.log('\nPara probar en Postman:');
        console.log('--------------------------------');
        console.log('URL: http://localhost:3001/api/login');
        console.log('Método: POST');
        console.log('Headers:');
        console.log('{');
        console.log('  "Content-Type": "application/json"');
        console.log('}');
        console.log('\nBody (raw JSON):');
        console.log(JSON.stringify(datosLogin, null, 2));
        console.log('--------------------------------');
    }
}

// Ejecutar la prueba
probarLogin(); 