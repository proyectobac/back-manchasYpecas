const { Sequelize } = require('sequelize')



const sequelize = new Sequelize({
    dialect: 'mysql',
    host: 'localhost',
    port:  3306, 
    username: 'root',  
    password:  '',  
    database: 'manchasYpecas',  
});

sequelize
    .authenticate()
    .then(() => {
        console.log("Conexión a la base de datos exitosa.");
    })
    .catch((err) => {
        console.log("Error al conectar a la base de datos: ", err.message);
    });

sequelize.sync()
    .then(() => {
        console.log("Tablas sincronizadas con éxito.");
    })
    .catch((err) => {
        console.log("Error al sincronizar las tablas: ", err.message);
    });

module.exports = { sequelize };
