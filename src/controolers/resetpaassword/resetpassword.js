const Usuario = require('../../models/usuarios/usuariosModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const nodemailer = require('nodemailer');
const { generarToken } = require('../inicioSesion/inicioSesionController')




//--------------------------------------------

const enviarCorreo = async (destinatario, asunto, contenido, credenciales) => {
  try {
    // Verificar si las credenciales están definidas y contienen el nombre de usuario y la contraseña
    if (!credenciales || !credenciales.usuario || !credenciales.contrasena) {
      throw new Error('Credenciales de usuario no proporcionadas');
    }

    // Configurar el transportador de correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: credenciales.usuario,
        pass: credenciales.contrasena,
      },
    });

    // Definir el correo electrónico a enviar
    const mailOptions = {
      from: credenciales.usuario,
      to: destinatario,
      subject: asunto,
      text: contenido,
    };

    // Enviar el correo electrónico
    const info = await transporter.sendMail(mailOptions);
    console.log('Correo electrónico enviado:', info.response);
  } catch (error) {
    console.error('Error al enviar el correo electrónico:', error);
    throw error; // Lanzar el error para manejarlo en el controlador que llama a esta función
  }
};


//----------------------------------------------------------------


// Método para solicitar restablecimiento
const solicitarRestablecimiento = async (req, res) => {
  const { correo } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { correo } });

    if (!usuario) {
      // return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            return res.status(404).json({ mensaje: 'Usuario no encontrado, asegurate de proporcionar tu correo correctamente' });

    }

    // Generar token de restablecimiento y establecer la fecha de vencimiento (5 minutos)
    const resetToken = generarToken(usuario, 'reset');
    const resetTokenExpires = moment().add(5, 'minutes').toDate(); // El token expira en 5 minutos

    // Actualizar en la base de datos
    await usuario.update({ reset_token: resetToken, reset_token_expires: resetTokenExpires });

    // Configurar credenciales para el envío del correo
    const credencialesGmail = {
      usuario: 'sionbarbershop5@gmail.com',  // Reemplaza con tu dirección de correo Gmail
      contrasena: 'qcnt uojt kypt fbqm',  // O utiliza una contraseña de aplicación
    };

    // Enviar correo electrónico con el enlace de recuperación que contiene el token
    await enviarCorreoRecuperacion(usuario.correo, resetToken, credencialesGmail);

    res.json({ mensaje: 'Hemos enviado un correo de recuperación con éxito. Revisa tu bandeja de entrada o la carpeta de correo no deseado y sigue las instrucciones para restablecer tu contraseña.', resetToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: '  Error en la solicitud de restablecimiento de contraseña' });
  }
};






const enviarCorreoRecuperacion = async (correoDestino, token, credenciales) => {
  try {
    // Configuración del transporte de correo electrónico para Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: credenciales.usuario,
        pass: credenciales.contrasena,
      },
    });

    // Buscar al usuario en la base de datos por su correo electrónico
    const usuario = await Usuario.findOne({ where: { correo: correoDestino } });

    // Verificar si se encontró al usuario
    if (!usuario) {
      throw new Error(` Usuario con correo ${correoDestino} no encontrado`);
    }

    // Obtener el nombre del usuario
    const nombreUsuario = usuario.nombre_usuario;

    // Construir el contenido del correo electrónico con el nombre del usuario
    const mensajeCorreo = `¡¡Hola ${nombreUsuario}!! No te preocupes. \n\nHaz clic en el siguiente enlace para restablecer tu contraseña: https://sion-rho.vercel.app/restablecerContrasena?token=${token}`;

    // Configuración del contenido del correo electrónico
    const mailOptions = {
      from: credenciales.usuario,
      to: correoDestino,
      subject: 'Recuperación de Contraseña',
      text: mensajeCorreo,
    };

    // Envío del correo electrónico
    const info = await transporter.sendMail(mailOptions);

    console.log(`Correo de recuperación enviado a ${correoDestino}`);
    console.log('URL de prueba de correo:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error(`Error al enviar el correo de recuperación a ${correoDestino}:`, error);
    throw error;
  }
};

const cambiarContrasena = async (req, res) => {
  const { token, nuevaContrasena } = req.body;

  try {
    // Verifica y decodifica el token
    const decodedToken = jwt.verify(token, 'secreto-seguro');

    // Verifica si el token ha expirado
    if (moment().isAfter(decodedToken.exp * 1000)) {
      return res.status(400).json({ mensaje: 'El token de restablecimiento ha caducado' });
    }

    // Busca al usuario en la base de datos por el ID proporcionado en el token
    const usuario = await Usuario.findByPk(decodedToken.userId);

    // Verifica si el usuario existe
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Hashea la nueva contraseña y actualiza en la base de datos
    const hashedContrasena = await bcrypt.hash(nuevaContrasena, 10);
    await usuario.update({ contrasena: hashedContrasena, reset_token: null, reset_token_expires: null });

    res.json({ mensaje: 'Contraseña cambiada con éxito' });
  } catch (error) {
    console.error('  Error al cambiar la contraseña:', error);
    res.status(500).json({ mensaje: 'Error al cambiar la contraseña' });
  }
};





module.exports = {
  solicitarRestablecimiento,
  cambiarContrasena,
  enviarCorreo,
};