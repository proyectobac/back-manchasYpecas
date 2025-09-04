const verificarCliente = (req, res, next) => {
    // Verificar que el usuario esté autenticado (esto ya se hace con verificarToken)
    if (!req.usuario || !req.usuario.userId) {
        return res.status(401).json({ 
            ok: false, 
            msg: "No autorizado. Token inválido o no proporcionado." 
        });
    }

    // Verificar que el usuario tenga rol de Cliente
    // El rol puede ser un string directo o un objeto con propiedad 'nombre'
    let rolNombre = '';
    if (typeof req.usuario.rol === 'string') {
        rolNombre = req.usuario.rol.toLowerCase();
    } else if (req.usuario.rol && req.usuario.rol.nombre) {
        rolNombre = req.usuario.rol.nombre.toLowerCase();
    } else if (req.usuario.rolNombre) {
        rolNombre = req.usuario.rolNombre.toLowerCase();
    }

    if (rolNombre !== 'cliente') {
        return res.status(403).json({
            ok: false,
            msg: "Acceso denegado. Esta función es exclusiva para clientes."
        });
    }

    // Si todo está bien, continuar
    next();
};

module.exports = verificarCliente; 