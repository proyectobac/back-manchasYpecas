'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Agregar los nuevos permisos
    await queryInterface.bulkInsert('Permisos', [
      {
        nombre_permiso: 'Configuracion',
        ruta: '/usuarios/lista',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre_permiso: 'roles',
        ruta: '/roles/lista',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    // Eliminar los permisos agregados en caso de revertir la migración
    await queryInterface.bulkDelete('Permisos', {
      nombre_permiso: {
        [Sequelize.Op.in]: ['Configuracion', 'roles']
      }
    }, {});
  }
}; 