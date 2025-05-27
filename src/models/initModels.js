const Usuario = require('./usuarios/usuariosModel');
const Empleado = require('./empleados/empleadosModel');

const initModels = () => {
  // Inicializar las asociaciones
  if (Usuario.associate) {
    Usuario.associate({ Empleado });
  }
  
  if (Empleado.associate) {
    Empleado.associate({ Usuario });
  }
};

module.exports = initModels; 