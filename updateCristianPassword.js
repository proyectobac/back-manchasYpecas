const bcrypt = require('bcrypt');
const { sequelize } = require('./database/config');

async function updateCristianPassword() {
    try {
        console.log('🔐 ACTUALIZANDO CONTRASEÑA DE CRISTIAN');
        console.log('═══════════════════════════════════════');

        // Nueva contraseña
        const nuevaContrasena = '12345678';
        
        // Encriptar la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(nuevaContrasena, saltRounds);
        
        console.log('🔒 Nueva contraseña:', nuevaContrasena);
        console.log('🔐 Hash generado:', hashedPassword.substring(0, 30) + '...');

        // Actualizar en la base de datos
        const [result] = await sequelize.query(
            'UPDATE usuarios SET contrasena = ? WHERE nombre_usuario = "Cristian"',
            { replacements: [hashedPassword] }
        );

        console.log('✅ Contraseña actualizada correctamente');
        console.log('📊 Filas afectadas:', result.affectedRows);

        // Verificar el cambio
        const [usuarios] = await sequelize.query(
            'SELECT id_usuario, nombre_usuario, correo FROM usuarios WHERE nombre_usuario = "Cristian"'
        );
        
        if (usuarios.length > 0) {
            console.log('✅ Verificación exitosa:');
            console.log('👤 Usuario:', usuarios[0].nombre_usuario);
            console.log('📧 Email:', usuarios[0].correo);
            console.log('🔑 Nueva contraseña:', nuevaContrasena);
        }

        await sequelize.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await sequelize.close();
    }
}

updateCristianPassword(); 