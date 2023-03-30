const sql = require('mssql');
const express = require('express');
const app = express();

// Configuración de la conexión a la base de datos de Azure
const config = {
  server: 'bibliotec-server.database.windows.net ',
  database: 'bibliotec-database',
  user: 'bibliotec-server-admin',
  password: 'Sprint01',
  options: {
    encrypt: true
  }
};

// Establecer conexión a la base de datos de Azure
sql.connect(config, err => {
  if (err) {
    console.log(err);
  } else {
    console.log('Conexión exitosa a la base de datos de Azure');
  }
});

// Endpoint de ejemplo que realiza una consulta a la base de datos de Azure
app.get('/ejemplo', (req, res) => {
  // Crear una nueva consulta a la base de datos
  const consulta = new sql.Request();
  
  // Ejecutar la consulta
  consulta.query('SELECT * FROM estudiantes', (err, resultado) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error al realizar la consulta');
    } else {
      res.send(resultado.recordset);
    }
  });
});

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});
