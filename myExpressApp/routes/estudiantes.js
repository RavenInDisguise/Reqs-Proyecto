var express = require('express');
const { sqlcon } = require('./database.js');
var router = express.Router();
let transporter = require('./correo.js');
const manejarError = require('./errores.js');
let estaAutenticado = require('./autenticado.js');
const bcrypt = require('bcrypt');
const { error } = require('pdf-lib');

//eliminar estudiante
router.put('/eliminar', (req, res) => {
    if (!estaAutenticado(req, true)) {
      return res.status(403).send('Acceso denegado');
    }
    const idEstudiante = req.query.id;
    const request = new sqlcon.Request();
    request.input('IN_idEstudiante', sqlcon.Int, idEstudiante)
  
    request.execute('BiblioTEC_SP_EliminarEstudiante',(error, resultado) =>{
      if(error){
        manejarError(res, error)
      }{
        res.status(200).send()
      }
    })
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
    const activo = bod.activo   
    
    bcrypt.hash(clave, 10, (err, hash) => {
  
      if (err) {
        console.log(err)
        return res.send({ message: err });
      }
      const request = new sqlcon.Request();

      request.input('IN_idEstudiante', sqlcon.Int, id)
      request.input('IN_Nombre', sqlcon.VarChar, nombre)
      request.input('IN_Apellido1', sqlcon.VarChar, apellido1)
      request.input('IN_Apellido2', sqlcon.VarChar, apellido2)
      request.input('IN_Cedula', sqlcon.Int, cedula)
      request.input('IN_Carnet', sqlcon.Int, carnet)
      request.input('IN_Correo', sqlcon.VarChar, correo)
      request.input('IN_FechaNacimiento', sqlcon.Date, fechaDeNacimiento)
      request.input('IN_Clave', sqlcon.VarChar, clave == "" ? clave : hash)
      request.input('In_Activo', sqlcon.Bit, activo)

      request.execute("BiblioTEC_SP_ActualizarEstudiante",(error, resultado)=>{
        if(error){
          manejarError(res, error)
        }else{
          res.status(200).send({message:'Estudiante actualizado exitosamente'})
        } 
      })
    });

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
      
      const request = new sqlcon.Request();
      request.input('IN_Nombre', sqlcon.VarChar, nombre)
      request.input('IN_Apellido1', sqlcon.VarChar, apellido1)
      request.input('IN_Apellido2', sqlcon.VarChar, apellido2)
      request.input('IN_Cedula', sqlcon.Int, cedula)
      request.input('IN_Carnet', sqlcon.Int, carnet)
      request.input('IN_Correo', sqlcon.VarChar, correo)
      request.input('IN_FechaNacimiento', sqlcon.Date, fechaDeNacimiento)
      request.input('IN_Clave', sqlcon.VarChar, hash)

      request.execute('BiblioTEC_SP_CrearEstudiante',(error, resultado) =>{
        if(error){
          manejarError(res,error)
        } else {
          const mailOptions = {
            from: transporter.options.auth.user,
            to: `${correo}` ,
            subject: 'Registro exitoso',
            text: `Se ha registrado exitosamente al estudiante:
  
            - Nombre: ${nombre}
            - Apellidos: ${apellido1} ${apellido2}
            - Carné: ${carnet}
            - Cédula: ${cedula}`
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Correo enviado: ' + info.response);
            }
          });
          res.status(200).send({message:"Registro exitoso"})
        }
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
      const request = new sqlcon.Request();

      request.input('IN_soloNombre', sqlcon.Bit, soloNombre)
      request.execute('BiblioTEC_SP_ObtenerEstudiantes', (error, resultado) => {
        if (error) {
          manejarError(res,error)
        } else {

          res.send(resultado.recordset);
        }
        
      });
    });
  
  //ruta ver datos de un Estudiante
  //se envia en el querry el id del estudiante
  router.get('/', (req, res) => {
    const estID = req.query.id;
    if (!estaAutenticado(req, true, estID)) {
      return res.status(403).send('Acceso denegado');
    }
    // Crear una nueva consulta a la base de datos
    const request = new sqlcon.Request();
    
    request.input('IN_idEstudiante', sqlcon.Int, estID)
  
    // Ejecutar la consulta
    request.execute('BiblioTEC_SP_ObtenerEstudiante', (error, resultado) => {
      if (error) {
        manejarError(res,error)
      } else {
        res.send(resultado.recordset);
      }
      
    });
  });

module.exports = router;