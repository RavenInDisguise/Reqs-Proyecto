var sqlcon = require('mssql');

// Configuración de la base de datos
const config = {
    user: 'BiblioAPI',
    password: 'BAiPbIli!0',
    server: 'appbibliotec.database.windows.net',
    database: 'appbibliotec-database',
    options: {
        encrypt: true
    }
}
  
// Establecer conexión a la base de datos de Azure
sqlcon.connect(config, err => {
    if (err) {
        console.log(err);
    } else {
        console.log('Conexión exitosa a la base de datos de Azure');
    }
});

module.exports = sqlcon