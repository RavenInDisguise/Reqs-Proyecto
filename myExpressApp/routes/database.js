var express = require('express');
var sqlcon = require('mssql');
var router = express.Router();

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
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
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
    var query = 'E.id, SELECT CONCAT(E.nombre,\' \',E.apellido1, \' \',E.apellido2) Nombre,'
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

//Rutas PUT
// "Eliminar"

//eliminar reserva
router.put('/reserva/eliminar', (req, res) => {
  const idReserva = req.body.id;
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
  const idEstudiante = req.body.id;
  const consulta = new sqlcon.Request();
  const query = `UPDATE Estudiantes SET activo = 0 WHERE id =` + idEstudiante;

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
  const idCubiculo = req.body.id;
  const consulta = new sqlcon.Request();
  const query = `UPDATE Cubiculos SET activo = 0 WHERE id =` + idCubiculo;

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

// update 

//editar estudiantes
router.put("/estudiante/actualizar",(req,res) =>{
  const bod = req.body
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
  const query = `UPDATE Estudiantes AS E
             LEFT JOIN Usuarios AS U 
             ON Estudiantes.idUsuario = U.id
             SET 
               E.nombre = '${nombre}', 
               E.apellido1 = '${apellido1}', 
               E.apellido2 = '${apellido2}', 
               E.cedula = '${cedula}', 
               E.carnet = '${carnet}', 
               E.fechaDeNacimiento = '${fechaDeNacimiento}',
               U.correo = '${correo}',
               U.clave = '${clave}'
             WHERE Estudiantes.id = ${id} AND U.id = E.idUsuario`;

  consulta.query(query, (err, resultado) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error al actualizar el estudiante');
    } else {
      res.send(resultado.recordset);
      console.log('Consulta realizada');
    }
  });
});


//Crear 

router.post("/estudiante/crear", (req, res) => {
  const bod = req.body;
  const nombre = bod.nombre;
  const apellido1 = bod.apellido1;
  const apellido2 = bod.apellido2;
  const cedula = bod.cedula;
  const carnet = bod.carnet;
  const correo = bod.correo;
  const clave = bod.clave;
  const fechaDeNacimiento = bod.fechaDeNacimiento;

  const transaction = new sqlcon.Transaction();
  transaction.begin((err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error al iniciar la transacción");
      return;
    }

    const usuarioQuery = `INSERT INTO Usuarios (
                            correo, 
                            clave, 
                            idTipoUsuario) 
                          VALUES (
                            '${correo}', 
                            '${clave}', 
                            3)`;
                            
    const estudianteQuery = `INSERT INTO Estudiantes (
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
                              '${apellido2}', '${cedula}', 
                              '${carnet}', 
                              '${fechaDeNacimiento}', 
                              SCOPE_IDENTITY(), 
                              1 )`;

    const request = new sqlcon.Request(transaction);
    request.query(usuarioQuery, (err, result) => {
      if (err) {
        console.log(err);
        transaction.rollback((err) => {
          if (err) {
            console.log(err);
            res.status(500).send("Error al hacer rollback de la transacción");
          } else {
            res.status(500).send("Error al crear el usuario");
          }
        });
      } else {
        request.query(estudianteQuery, (err, result) => {
          if (err) {
            console.log(err);
            transaction.rollback((err) => {
              if (err) {
                console.log(err);
                res.status(500).send("Error al hacer rollback de la transacción");
              } else {
                res.status(500).send("Error al crear el estudiante");
              }
            });
          } else {
            transaction.commit((err) => {
              if (err) {
                console.log(err);
                res.status(500).send("Error al hacer commit de la transacción");
              } else {
                res.send("Estudiante creado exitosamente");
              }
            });
          }
        });
      }
    });
  });
});

//crear usuario

module.exports = router;