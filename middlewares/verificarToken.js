const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ mensaje: 'Token NO proporcionado' });
  }

  const tokenParts = token.split(' ');

  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(403).json({ mensaje: 'Formato de token inválido' });
  }

  const tokenValue = tokenParts[1];

  const secretKey = process.env.JWT_SECRET || 'secreto-seguro';

  jwt.verify(tokenValue, secretKey, (err, decoded) => {
    if (err) {
      console.error('Error al verificar el token:', err);
      return res.status(401).json({ mensaje: 'Token Inválido' });
    }

    req.usuario = decoded; // Agrega la información del usuario a la solicitud

    next();
  });
}

module.exports = verificarToken;
