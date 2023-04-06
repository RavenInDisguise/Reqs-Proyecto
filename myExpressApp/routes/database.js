var express = require('express');
var sqlcon = require('mssql');
var router = express.Router();
var cors = require("cors");

// configuracion de la db
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
sqlcon.connect(config, err => {
    if (err) {
        console.log(err);
    } else {
        console.log('Conexión exitosa a la base de datos de Azure');
    }
});

//ruta base
/* GET home page. */
router.get('/', cors(), function(req, res, next) {
    res.render('index', { title: 'Express' });
  });
  
//ruta de prueba 
router.post('/', async(req,res)=>{
  const {email, password} = req.body
  const check = new sqlcon.Request();
  check.query(`Select U.id FRom Usuarios U
  Inner Join TiposUsuario TU ON U.idTipoUsuario = TU.id
  where TU.id = 3 AND u.correo = '${email}' AND U.clave = '${password}'`, (err,result)=>{
    if (err) {
      console.log(err);
      res.status(500).send('Error al realizar la consulta')
    } else {
      console.log(req.cookies)
      res.send(result.recordset)
    }
    console.log('Consulta realizada');
  });
  

});

module.exports = router;