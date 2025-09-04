const bcrypt = require('bcrypt');
const { sequelize } = require('./database/config');

async function createTestClient() {
    try {
        console.log('👤 CREANDO USUARIO CLIENTE DE PRUEBA');
        console.log('═══════════════════════════════════════');

        // Datos del nuevo cliente
        const clienteData = {
            nombre_usuario: 'ClienteTest',
            correo: 'cliente@test.com',
            contrasena: '12345678',
            telefono: '3001234567',
            apellido: 'TestApellido',
            documento: '1234567890'
        };

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(clienteData.contrasena, 10);

        // Verificar si existe el rol Cliente (ID 3)
        const [roles] = await sequelize.query('SELECT id_rol, nombre FROM roles WHERE nombre = "Cliente"');
        if (roles.length === 0) {
            throw new Error('Rol Cliente no encontrado');
        }
        const rolCliente = roles[0];

        // Verificar si el usuario ya existe
        const [existeUsuario] = await sequelize.query(
            'SELECT id_usuario FROM usuarios WHERE nombre_usuario = ? OR correo = ?',
            { replacements: [clienteData.nombre_usuario, clienteData.correo] }
        );

        if (existeUsuario.length > 0) {
            console.log('⚠️  Usuario ya existe, actualizando...');
            await sequelize.query(
                'UPDATE usuarios SET contrasena = ?, telefono = ?, apellido = ?, documento = ? WHERE nombre_usuario = ?',
                { replacements: [hashedPassword, clienteData.telefono, clienteData.apellido, clienteData.documento, clienteData.nombre_usuario] }
            );
        } else {
            console.log('➕ Creando nuevo usuario...');
            await sequelize.query(
                'INSERT INTO usuarios (id_rol, nombre_usuario, correo, contrasena, telefono, apellido, documento, estado) VALUES (?, ?, ?, ?, ?, ?, ?, "Activo")',
                { replacements: [rolCliente.id_rol, clienteData.nombre_usuario, clienteData.correo, hashedPassword, clienteData.telefono, clienteData.apellido, clienteData.documento] }
            );
        }

        console.log('✅ Usuario cliente creado/actualizado:');
        console.log('👤 Usuario:', clienteData.nombre_usuario);
        console.log('📧 Email:', clienteData.correo);
        console.log('🔑 Contraseña:', clienteData.contrasena);
        console.log('🎭 Rol:', rolCliente.nombre);

        await sequelize.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await sequelize.close();
    }
}

createTestClient(); 