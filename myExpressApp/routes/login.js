var express = require('express');
var router = express.Router();
import sqlcon from './database';
const cors = require('cors');
const bcrypt = require('bcrypt')

// Autenticación

//ruta base
/* GET home page. */
router.get('/', cors(), function(req, res, next) {
    res.render('index');
});

// Verificar si hay una sesión iniciada



router.get('/api/login', (req, res) => {
  const saved = req.session.user;

  if (saved) {
    res.send({
      loggedIn : true,
      userId : saved.userId,
      email : saved.email,
      idEstudiante: saved.idEstudiante,
      tipoUsuario: saved.tipoUsuario
    });
  } else {
    res.send({
      loggedIn : false
    });
  }
});

  // Cierre de sesión
  router.get('api/logout', (req, res) => {
    const saved = req.session.user;
  
    if (saved) {
      req.session.user = null;
      res.send({
        message : "Ok"
      });
    } else {
      res.status(401).send({
        message: 'No hay ninguna sesión activa'
      });
    }
  });
  
// Inicio de sesión
router.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const check = new sqlcon.Request();
  check.query(`
  SELECT U.id UsuarioID,
         U.clave,
         U.correo,
         E.id EstudianteID,
	       U.idTipoUsuario,
	       TU.descripcion TipoUsuario
  FROM Usuarios U
  INNER JOIN  TiposUsuario TU
  ON U.idTipoUsuario = TU.id
  LEFT JOIN Estudiantes E
  ON U.id = E.idUsuario   
  WHERE U.correo = '${email}'
  `, (err, result) => {
    if (err) {
      res.status(500).send({ message: 'Error al realizar la consulta' });
    } else {
      if (result.recordset.length > 0) {
        bcrypt.compare(password, result.recordset[0].clave, (error, response) => {
          if (response) {
            /* Coincide */
            req.session.user = {
              userId: result.recordset[0].UsuarioID,
              email: result.recordset[0].correo,
              idEstudiante: result.recordset[0].EstudianteID,
              tipoUsuario : result.recordset[0].TipoUsuario
            };
            console.log(result.recordset[0].TipoUsuario)
            res.send(req.session.user);
          } else {
            /* No coincide */
            res.status(401).send({message:'No coincide el usuario o contraseña'});
          }
        })
      } else {
        res.status(401).send({ message: "El usuario no existe" });
      }
    }
    console.log('Consulta realizada');
  });
});



module.exports = router;