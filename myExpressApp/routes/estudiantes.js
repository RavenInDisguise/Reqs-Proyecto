var express = require('express');
const sqlcon = require('./database')
var router = express.Router();
let transporter = require('./correo')
let qr = require('qrcode')
let estaAutenticado = require('./autenticado')

//eliminar estudiante
router.put('/eliminar', (req, res) => {
    if (!estaAutenticado(req, true)) {
      return res.status(403).send('Acceso denegado');
    }
    const idEstudiante = req.query.id;
    const consulta = new sqlcon.Request();
    const query = `UPDATE Estudiantes SET activo = 0 WHERE id = ${idEstudiante}`;
  
    consulta.query(query, (err, resultado) => {
      if (err) {
        console.log(err);
        res.status(500).send('Error al realizar la consulta');
      } else {
        res.send(resultado.recordset);
        console.log('Consulta realizada');
      }
    });
  });
  
  
  
  //editar estudiantes
  router.put("/actualizar",(req,res) =>{
    if (!estaAutenticado(req, true)) {
      return res.status(403).send('Acceso denegado');
    }
    const bod = req.body
    const id = bod.idEstudiante
    const nombre = bod.nombre
    const apellido1 = bod.apellido1
    const apellido2 = bod.apellido2
    const cedula = bod.cedula
    const carnet = bod.carnet
    const correo = bod.correo
    const clave = bod.clave
    const fechaDeNacimiento = bod.fechaNacimiento.split("T")[0]
  
    bcrypt.hash(clave, 10, (err, hash) => {
  
      if (err) {
        console.log(err)
        return res.send({ message: err });
      }
      const consulta = new sqlcon.Request();
  
      const query1 = `UPDATE Estudiantes
                      SET 
                        nombre = '${nombre}', 
                        apellido1 = '${apellido1}', 
                        apellido2 = '${apellido2}', 
                        cedula = '${cedula}', 
                        carnet = '${carnet}', 
                        fechaDeNacimiento = '${fechaDeNacimiento}'
                      WHERE id = '${id}';`;
    
      const query2 = (clave == ''? `UPDATE Usuarios
                                    SET 
                                     correo = '${correo}'
                                    WHERE id = (SELECT idUsuario FROM Estudiantes WHERE id = '${id}');`:
                                   `UPDATE Usuarios
                                    SET 
                                      correo = '${correo}',
                                      clave = '${hash}'
                                    WHERE id = (SELECT idUsuario FROM Estudiantes WHERE id = '${id}');`) 
      
    
    
      consulta.query(query1 + ";" + query2, (err, resultado) => {
        if (err) {
          console.log(err);
          res.status(500).send({message:'Error al actualizar el estudiante'});
        }else{
          res.send({message:'Cambio exitoso'});
          console.log('Consulta realizada');
        }
      });
      
      })
  });
  
  
  //Crear 
  
  //crear usuario
  router.post("/crear", (req, res) => {
    const bod = req.body;
    const nombre = bod.nombre;
    const apellido1 = bod.apellido1;
    const apellido2 = bod.apellido2;
    const cedula = bod.cedula;
    const carnet = bod.carnet;
    const correo = bod.correo;
    const clave = bod.clave;
    const fechaDeNacimiento = bod.fechaDeNacimiento;
  
    bcrypt.hash(clave, 10, (err, hash) => {
  
      if (err) {
        return res.send({ err: err });
      }
  
      const queryS =`
        SELECT id FROM Estudiantes E
        WHERE E.carnet = ${carnet} OR E.cedula = ${cedula}
        UNION 
        SELECT id FROM Usuarios U
        WHERE U.correo = '${correo}'
        `
      const consulta = new sqlcon.Request();
  
      consulta.query(queryS, (err, result)=>{
        if (err) {
          return res.status(500).send({message:'Error al registrar el estudiante'});
        } else {
          if(result.recordset.length >= 1){
            return res.status('422').send({message:'Ya existe el estudiante'})
          }
        }
        const queryI = `
      INSERT INTO Usuarios (
        correo, 
        clave, 
        idTipoUsuario) 
      VALUES (
        '${correo}', 
        '${hash}', 
        3)
      
      DECLARE @idUsuario INT
      SET @idUsuario = SCOPE_IDENTITY()  
  
      INSERT INTO Estudiantes (
        nombre, 
        apellido1, 
        apellido2, 
        cedula, 
        carnet, 
        fechaDeNacimiento, 
        idUsuario,
        activo) 
      VALUES (
        '${nombre}',
        '${apellido1}', 
        '${apellido2}', 
        '${cedula}', 
        '${carnet}', 
        '${fechaDeNacimiento}', 
        @idUsuario, 
        1)
        `;
        const insertar = new sqlcon.Request();
      insertar.query(queryI, (err, resultado) => {
        if (err) {
          res.status(500).send({message:'Error al registrar el estudiante'});
        } else {
          const mailOptions = {
            from: mail,
            to: `${correo}` ,
            subject: 'Registro exitoso',
            text: `Se ha registrado exitosamente al estudiante:
            Nombre: ${nombre}
            Apellidos: ${apellido1} ${apellido2}
            Carné: ${carnet}
            Cédula: ${cedula}`
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Correo enviado: ' + info.response);
            }
          });
          res.status(200).send({message:'Registro exitoso'});
        }
      });
      })
      
    })
  
  });


  
  //Rutas GET
  
  //ruta de estudiantes 
  //retorna una lista de estudiantes con su nombre(completo), carnet, cedula y correo
  router.get('/estudiantes', (req, res) => {
    if (!estaAutenticado(req, true)) {
      return res.status(403).send('Acceso denegado');
    }
      const soloNombre = req.query.soloNombre;
      // Crear una nueva consulta a la base de datos
      const consulta = new sqlcon.Request();
      var query = (soloNombre ? `SELECT E.id, CONCAT(E.nombre, ' ', E.apellido1, ' ' ,E.apellido2) Nombre
        FROM Estudiantes E
        WHERE E.activo = 1;` : 'SELECT E.id, CONCAT(E.nombre,\' \',E.apellido1, \' \',E.apellido2) Nombre,'
        + ' E.carnet, E.cedula, U.correo, E.activo '
        + 'FROM Estudiantes AS E ' 
        + 'LEFT JOIN Usuarios AS U ON U.id = E.idUsuario;');
  
      // Ejecutar la consulta
      consulta.query(query, (err, resultado) => {
        if (err) {
          console.log(err);
          res.status(500).send('Error al realizar la consulta');
        } else {
          res.send(resultado.recordset);
          console.log('Consulta realizada');
        }
        
      });
    });
  
  //ruta ver datos de 1 Estudiante
  //se envia en el querry el id del estudiante
  router.get('/', (req, res) => {
    const estID = req.query.id;
    if (!estaAutenticado(req, true, estID)) {
      return res.status(403).send('Acceso denegado');
    }
    // Crear una nueva consulta a la base de datos
    const consulta = new sqlcon.Request();
    var query = `SELECT 
                  E.id,
                  E.nombre,
                  E.apellido1,
                  E.apellido2,
                  E.cedula,
                  E.carnet,
                  E.fechaDeNacimiento fechaDeNacimiento,
                  U.correo
                FROM Estudiantes AS E 
                LEFT JOIN Usuarios AS U 
                ON U.id = E.idUsuario
                WHERE E.id =` + estID
  
    // Ejecutar la consulta
    consulta.query(query, (err, resultado) => {
      if (err) {
        console.log(err);
        res.status(500).send('Error al realizar la consulta');
      } else {
        res.send(resultado.recordset);
        console.log('Consulta realizada');
      }
      
    });
  });

module.exports = router;