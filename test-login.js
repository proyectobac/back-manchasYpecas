const axios = require('axios');

async function testLogin() {
    try {
        console.log('Probando login con Cristian...');
        
        const response = await axios.post('http://localhost:3000/api/login', {
            nombre_usuario: 'Cristian',
            contrasena: '12345678'
        });
        
        console.log('Login exitoso:', response.data.usuario.nombre_usuario);
        console.log('Rol:', response.data.usuario.Rol.nombre);
        console.log('Token recibido');
        
    } catch (error) {
        console.log('Error:', error.response?.data || error.message);
    }
}

testLogin(); 