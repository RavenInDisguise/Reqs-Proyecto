const sql = require('mssql');
const express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);

// Configuración de la conexión a la base de datos de Azure
const config = {
    user: 'bibliotec-server-admin',
    password: 'Sprint01',
    server: 'bibliotec-server.database.windows.net',
    database: 'bibliotec-database',
    options: {
        encrypt: true
    }
}

// Establecer conexión a la base de datos de Azure
sql.connect(config, err => {
  if (err) {
    console.log(err);
  } else {
    console.log('Conexión exitosa a la base de datos de Azure');
  }
});




app.get()
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
    console.log('Consulta realizada');
  });
});

/* GET users listing. */
router.get('/res', function(req, res, next) {
  res.send('respond with a resource');
});

const port = process.env.PORT || 8080; 
// Iniciar servidor

server.listen(port, () => {
  console.log('Servidor iniciado en el puerto: ' + port);
});
