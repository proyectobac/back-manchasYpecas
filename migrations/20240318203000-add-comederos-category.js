'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Modificar el tipo enum para incluir 'COMEDEROS'
    await queryInterface.sequelize.query(`
      ALTER TABLE productos 
      MODIFY COLUMN categoria 
      ENUM('SNACKS', 'HIGIENE', 'JUGUETERIA', 'ACCESORIOS', 'COMEDEROS') 
      NOT NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revertir el cambio (primero asegurarse que no hay productos con categoría COMEDEROS)
    await queryInterface.sequelize.query(`
      UPDATE productos SET categoria = 'ACCESORIOS' WHERE categoria = 'COMEDEROS';
      ALTER TABLE productos 
      MODIFY COLUMN categoria 
      ENUM('SNACKS', 'HIGIENE', 'JUGUETERIA', 'ACCESORIOS') 
      NOT NULL;
    `);
  }
}; 