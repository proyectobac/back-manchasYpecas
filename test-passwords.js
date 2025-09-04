const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function testPasswords() {
    const contrasenasPosibles = [
        '12345678',
        '123456789', 
        '12345678S',
        'cristian',
        'Cristian',
        'cirs@gamail.com',
        'password',
        '1234',
        '123456',
        'qwerty'
    ];

    console.log('🔐 PROBANDO CONTRASEÑAS PARA CRISTIAN');
    console.log('════════════════════════════════════════');

    for (const contrasena of contrasenasPosibles) {
        try {
            console.log(`🔍 Probando: "${contrasena}"`);
            
            const response = await axios.post(`${API_BASE_URL}/api/login`, {
                nombre_usuario: 'Cristian',
                contrasena: contrasena
            });
            
            if (response.data && response.data.token) {
                console.log(`✅ ¡ÉXITO! Contraseña correcta: "${contrasena}"`);
                console.log('👤 Usuario:', response.data.usuario.nombre_usuario);
                console.log('🎭 Rol:', response.data.usuario.Rol.nombre);
                console.log('🔑 Token obtenido');
                return contrasena;
            }
            
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log(`❌ "${contrasena}" - Contraseña incorrecta`);
            } else {
                console.log(`⚠️  "${contrasena}" - Error: ${error.message}`);
            }
        }
    }
    
    console.log('\n❌ NINGUNA CONTRASEÑA FUNCIONÓ');
    console.log('💡 Necesitamos crear o actualizar las credenciales de Cristian');
    return null;
}

// Ejecutar test
testPasswords(); 