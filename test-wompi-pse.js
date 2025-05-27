const axios = require('axios');
require('dotenv').config();

// Token proporcionado
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub21icmVfdXN1YXJpbyI6IkZlbGljaWFub20iLCJ1c2VySWQiOjIsInJvbCI6eyJpZF9yb2wiOjIsIm5vbWJyZSI6IkVtcGxlYWRvIiwiZXN0YWRvIjoiQWN0aXZvIiwicGVybWlzb3MiOlt7ImlkX3Blcm1pc28iOjEyLCJub21icmVfcGVybWlzbyI6Im1pIHBvcnRhbCIsInJ1dGEiOiIvcGVybWlzb0Rhc2JvYXJkRW1wbGVhZG8ifSx7ImlkX3Blcm1pc28iOjgsIm5vbWJyZV9wZXJtaXNvIjoiQ3JlYXIgQ29tcHJhcyIsInJ1dGEiOiIvY29tcHJhcy9jcmVhciJ9LHsiaWRfcGVybWlzbyI6OSwibm9tYnJlX3Blcm1pc28iOiJsaXN0YSBDb21wcmFzIiwicnV0YSI6Ii9jb21wcmFzL2xpc3RhIn1dfSwiaWF0IjoxNzQ4MzgxNzMzLCJleHAiOjE3NDg0NjgxMzN9.bBcDJe4cBdfUSdj-DXAVi7EC1ERdTqZ0GO-l3WaB_ko';

// Datos de prueba para PSE
const datosPrueba = {
    nombre_completo: "Feliciano Mosquera",
    email: "felixx-21@hotmail.com",
    telefono: "3146557535",
    tipo_persona: "natural",
    tipo_documento: "CC",
    documento: "1234567890",
    banco_codigo: "1007", // Código de Bancolombia en sandbox
    items: [
        {
            id_producto: 1,
            cantidad: 1,
            precioVenta: 50000
        }
    ],
    direccion_entrega: "Calle 123 #45-67",
    ciudad: "Bogotá",
    notasAdicionales: "Por favor entregar en horario de la mañana"
};

const iniciarPagoPSE = async () => {
    try {
        console.log('Iniciando prueba de pago PSE en Wompi...');
        console.log('Datos a enviar:', JSON.stringify(datosPrueba, null, 2));

        const response = await axios.post(
            'http://localhost:3001/api/pagos/pse/iniciar',
            datosPrueba,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                }
            }
        );

        console.log('\nRespuesta exitosa:');
        console.log('--------------------------------');
        console.log('Estado:', response.status);
        console.log('Datos:', JSON.stringify(response.data, null, 2));

        if (response.data.success && response.data.redirect_url) {
            console.log('\nLink de pago generado:');
            console.log('--------------------------------');
            console.log('URL:', response.data.redirect_url);
            console.log('Referencia:', response.data.referencia);
            console.log('ID del link:', response.data.link_id);
        }

    } catch (error) {
        console.log('\nError al procesar el pago:');
        console.log('--------------------------------');
        console.log('Estado:', error.response?.status);
        console.log('Datos:', JSON.stringify({
            success: false,
            error: error.message,
            details: error.response?.data
        }, null, 2));
        console.log('--------------------------------');

        // Mostrar información para Postman
        console.log('\nPara probar en Postman:');
        console.log('--------------------------------');
        console.log('1. Iniciar pago PSE:');
        console.log('URL: http://localhost:3001/api/pagos/pse/iniciar');
        console.log('Método: POST');
        console.log('Headers:');
        console.log(JSON.stringify({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`
        }, null, 2));
        console.log('\nBody (raw JSON):');
        console.log(JSON.stringify(datosPrueba, null, 2));
        console.log('--------------------------------');
    }
};

iniciarPagoPSE(); 