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

//ruta de prueba 
router.get('/prueba', (req, res) => {
    // Crear una nueva consulta a la base de datos
    const consulta = new sqlcon.Request();
    
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



//Rutas GET

//ruta de estudiantes 
//retorna una lista de estudiantes con su nombre(completo), carnet, cedula y correo
router.get('/estudiantes', (req, res) => {
    // Crear una nueva consulta a la base de datos
    const consulta = new sqlcon.Request();
    var query = 'SELECT E.id, CONCAT(E.nombre,\' \',E.apellido1, \' \',E.apellido2) Nombre,'
      + ' E.carnet, E.cedula, U.correo '
      + 'FROM Estudiantes AS E ' 
      + 'LEFT JOIN Usuarios AS U ON U.id = E.idUsuario;'

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
router.get('/estudiante', (req, res) => {
  const estID = req.query.id;
  // Crear una nueva consulta a la base de datos
  const consulta = new sqlcon.Request();
  var query = `SELECT 
                E.id,
                E.nombre,
                E.apellido1,
                E.apellido2,
                E.cedula,
                E.carnet,
                FORMAT(E.fechaDeNacimiento, 'dd/MM/yyyy') fechaDeNacimiento,
                U.correo,
                U.clave
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

//ruta de cubiculos 
//retorna una lista cubiculos, esta contiene el nombre, el estado, la capacidad y una lista de servicios especiales
router.get('/cubiculos', (req, res) => {
  const consulta = new sqlcon.Request();
  const query = `SELECT C.id, C.nombre, EC.descripcion AS estado, C.capacidad, SE.descripcion AS servicio 
                 FROM Cubiculos AS C 
                 LEFT JOIN EstadosCubiculo AS EC ON C.idEstado = EC.id 
                 LEFT JOIN ServiciosDeCubiculo AS SC ON C.id = SC.idCubiculo 
                 LEFT JOIN ServiciosEspeciales AS SE ON SC.idServiciosEspeciales = SE.id`;
  
  consulta.query(query, (err, resultado) => {
      if (err) {
          console.log(err);
          res.status(500).send('Error al realizar la consulta');
      } else {
          const cubiculos = {};

          // Agrupar servicios por cubículo
          for (let i = 0; i < resultado.recordset.length; i++) {
              const cubiculo = resultado.recordset[i];
              const idCubiculo = cubiculo.id;
              const servicio = cubiculo.servicio;

              if (cubiculos[idCubiculo]) {
                  cubiculos[idCubiculo].servicios.push(servicio);
              } else {
                  const { id, nombre, capacidad, estado } = cubiculo;
                  cubiculos[idCubiculo] = {
                      id,
                      nombre,
                      capacidad,
                      estado,
                      servicios: [servicio]
                  };
              }
          }

          // Convertir objetos a array
          const resultadoFinal = Object.values(cubiculos);

          res.send(resultadoFinal);
          console.log('Consulta realizada');
      }
  });
});


//ruta de 1 cubiculo
//retorna una lista cubiculos, esta contiene el nombre, el estado, la capacidad y una lista de servicios especiales
router.get('/cubiculo', (req, res) => {
  const cubID = req.query.id;
  const consulta = new sqlcon.Request();
  const query = `SELECT C.id,
                  C.nombre, 
                  EC.descripcion AS estado, 
                  C.capacidad, 
                  SE.descripcion AS servicio 
                FROM Cubiculos AS C 
                LEFT JOIN EstadosCubiculo AS EC ON C.idEstado = EC.id 
                LEFT JOIN ServiciosDeCubiculo AS SC ON C.id = SC.idCubiculo 
                LEFT JOIN ServiciosEspeciales AS SE ON SC.idServiciosEspeciales = SE.id
                WHERE C.id =` + cubID;
  
  consulta.query(query, (err, resultado) => {
      if (err) {
          console.log(err);
          res.status(500).send('Error al realizar la consulta');
      } else {
          const cubiculos = {};

          // Agrupar servicios por cubículo
          for (let i = 0; i < resultado.recordset.length; i++) {
              const cubiculo = resultado.recordset[i];
              const idCubiculo = cubiculo.id;
              const servicio = cubiculo.servicio;

              if (cubiculos[idCubiculo]) {
                  cubiculos[idCubiculo].servicios.push(servicio);
              } else {
                  const { id, nombre, capacidad, estado } = cubiculo;
                  cubiculos[idCubiculo] = {
                      id,
                      nombre,
                      capacidad,
                      estado,
                      servicios: [servicio]
                  };
              }
          }

          // Convertir objetos a array
          const resultadoFinal = Object.values(cubiculos);

          res.send(resultadoFinal);
          console.log('Consulta realizada');
      }
  });
});


//ruta de cubiculos disponibles 
//retorna una lista cubiculos disponibles, esta contiene el nombre, el estado, la capacidad y una lista de servicios especiales
router.get('/cubiculos/disponibles', (req, res) => {
  const consulta = new sqlcon.Request();
  const query = `SELECT C.id, C.nombre, EC.descripcion AS estado, C.capacidad, SE.descripcion AS servicio 
                 FROM Cubiculos AS C 
                 LEFT JOIN EstadosCubiculo AS EC ON C.idEstado = EC.id 
                 LEFT JOIN ServiciosDeCubiculo AS SC ON C.id = SC.idCubiculo 
                 LEFT JOIN ServiciosEspeciales AS SE ON SC.idServiciosEspeciales = SE.id
                 WHERE EC.descripcion = 'Disponible'`;
  
  consulta.query(query, (err, resultado) => {
      if (err) {
          console.log(err);
          res.status(500).send('Error al realizar la consulta');
      } else {
          const cubiculos = {};

          // Agrupar servicios por cubículo
          for (let i = 0; i < resultado.recordset.length; i++) {
              const cubiculo = resultado.recordset[i];
              const idCubiculo = cubiculo.id;
              const servicio = cubiculo.servicio;

              if (cubiculos[idCubiculo]) {
                  cubiculos[idCubiculo].servicios.push(servicio);
              } else {
                  const { id, nombre, capacidad, estado } = cubiculo;
                  cubiculos[idCubiculo] = {
                      id,
                      nombre,
                      capacidad,
                      estado,
                      servicios: [servicio]
                  };
              }
          }

          // Convertir objetos a array
          const resultadoFinal = Object.values(cubiculos);

          res.send(resultadoFinal);
          console.log('Consulta realizada');
      }
  });
});



//ruta de reservas 
//retorna una lista de reservas, esta contiene el id de reserva, el nombre, la capacidad y la fecha y hora de reserva
router.get('/reservas', (req, res) => {
  // Crear una nueva consulta a la base de datos
  const consulta = new sqlcon.Request();
  var query = `SELECT R.id,
                C.nombre, 
                C.capacidad, 
                FORMAT(R.fecha, 'dd/MM/yyyy') AS fecha,
                FORMAT(R.horaInicio, 'HH:mm') AS horaInicio,
                FORMAT(R.horaFin, 'HH:mm') AS horaFin
              FROM Reservas AS R 
              LEFT JOIN Cubiculos AS C ON R.idCubiculo = C.id
              WHERE R.activo = 1`

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


//ruta de reseervas de estudiante
//retorna una lista de reservas realizadas por un estudiante, 
//esta contiene eel id de reserva, el nombre, 
//la capacidad y la fecha y hora de reserva
router.get('/estudiante/reservas', (req, res) => {
  const estID = req.query.id;
  // Crear una nueva consulta a la base de datos
  const consulta = new sqlcon.Request();
  var query = `SELECT R.id,
                C.nombre, 
                C.capacidad, 
                FORMAT(R.fecha, 'dd/MM/yyyy') AS fecha,
                FORMAT(R.horaInicio, 'HH:mm') AS horaInicio,
                FORMAT(R.horaFin, 'HH:mm') AS horaFin
              FROM Reservas AS R 
              LEFT JOIN Cubiculos AS C ON R.idCubiculo = C.id
              WHERE R.activo = 1 AND R.idEstudiante =` + estID;

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



//login
router.get('/login', (req, res) => {
  const correo = req.query.correo;
  const clave = req.query.clave;
  // Crear una nueva consulta a la base de datos
  const consulta = new sqlcon.Request();

  // tipo usuario 2 = Admin, 3 = Estudiante
  var query = `SELECT 
                E.id, 
                U.idTipoUsuario 
              FROM Usuarios AS U
              LEFT JOIN Estudiantes AS E
              ON U.id = E.idUsuario
              WHERE 
                correo = '${correo}' AND 
                clave = '${clave}'` ;

  // Ejecutar la consulta
  consulta.query(query, (err, resultado) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error al realizar la consulta');
    } else {
      console.log(resultado.recordset);
      res.send(resultado.recordset);
      console.log('Consulta realizada');
    }
    
  });
});
//Rutas PUT
// "Eliminar"

//eliminar reserva
router.put('/reserva/eliminar', (req, res) => {
  const idReserva = req.query.id;
  const consulta = new sqlcon.Request();
  const query = `UPDATE Reservas SET activo = 0 WHERE id =` + idReserva;

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

//eliminar estudiante
router.put('/estudiante/eliminar', (req, res) => {
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

//eliminar cubiculo 
router.put("/cubiculo/eliminar",(req,res) =>{
  const idCubiculo = req.query.id;
  const consulta = new sqlcon.Request();
  const query = `UPDATE Cubiculos SET idEstado = 5 WHERE id =` + idCubiculo;

  consulta.query(query, (err, resultado) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error al realizar la consulta');
    } else {
      res.status(200).send(resultado.recordset);
      console.log('Consulta realizada');
    }
  });
});

// update 

//editar estudiantes
router.put("/estudiante/actualizar",(req,res) =>{
  const bod = req.query
  const id = bod.id
  const nombre = bod.nombre
  const apellido1 = bod.apellido1
  const apellido2 = bod.apellido2
  const cedula = bod.cedula
  const carnet = bod.carnet
  const correo = bod.correo
  const clave = bod.clave
  const fechaDeNacimiento = bod.fechaDeNacimiento

  const consulta = new sqlcon.Request();
  const query1 = `UPDATE Estudiantes
                  SET 
                    nombre = '${nombre}', 
                    apellido1 = '${apellido1}', 
                    apellido2 = '${apellido2}', 
                    cedula = ${cedula}, 
                    carnet = ${carnet}, 
                    fechaDeNacimiento = '${fechaDeNacimiento}'
                  WHERE id = ${id};`;

  const query2 = `UPDATE Usuarios
                  SET 
                    correo = '${correo}',
                    clave = '${clave}'
                  WHERE id = (SELECT idUsuario FROM Estudiantes WHERE id = ${id});`;


  consulta.query(query1 + ";" + query2, (err, resultado) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error al actualizar el estudiante');
    } else {
      res.send(resultado);
      console.log('Consulta realizada');
    }
  });
});




//Crear 

//crear usuario
router.put("/estudiante/crear", (req, res) => {
  const bod = req.query;
  const nombre = bod.nombre;
  const apellido1 = bod.apellido1;
  const apellido2 = bod.apellido2;
  const cedula = bod.cedula;
  const carnet = bod.carnet;
  const correo = bod.correo;
  const clave = bod.clave;
  const fechaDeNacimiento = bod.fechaDeNacimiento;

  const quer = `
    INSERT INTO Usuarios (
      correo, 
      clave, 
      idTipoUsuario) 
    VALUES (
      '${correo}', 
      '${clave}', 
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
  const consulta = new sqlcon.Request();
  consulta.query(quer, (err, resultado) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error al actualizar el estudiante');
    } else {
      res.send(resultado);
      console.log('Consulta realizada');
    }
  });
  
});



module.exports = router;