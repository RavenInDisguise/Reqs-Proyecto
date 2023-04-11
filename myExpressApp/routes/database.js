var express = require('express');
var sqlcon = require('mssql');
var router = express.Router();
var cors = require("cors");
var qr = require('qrcode')
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt')
const saltRounds = 10

const mail = 'bibliotec.itcr@gmail.com'

//configuracion del correo 
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: mail,
    pass: 'xykvnpfvomvkgstf'
  }
});

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
    res.render('index');
});

// Verificar si hay una sesión iniciada

router.get('/login', (req, res) => {
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
  
// Inicio de sesión
router.post('/login', async (req, res) => {
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
            res.status(401).send({  });
          }
        })
      } else {
        res.status(401).send({ message: "El usuario no existe" });
      }
    }
    console.log('Consulta realizada');
  });
});

// Cierre de sesión
router.get('/logout', (req, res) => {
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
      + ' E.carnet, E.cedula, U.correo, E.activo '
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
                 LEFT JOIN ServiciosDeCubiculo AS SC ON C.id = SC.idCubiculo AND SC.activo = 1 
                 LEFT JOIN ServiciosEspeciales AS SE ON SC.idServiciosEspeciales = SE.id;`;
  
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
                      servicios: ((servicio) ? [servicio] : [])
                      /* Cuando no hay servicios, da un arreglo vacío
                      en lugar de un arreglo con un elemento nulo */
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

//Ruta para los estados de los cubículos
router.get('/estados', (req, res) => {
  const consulta = new sqlcon.Request();
  const query = `
  SELECT [descripcion]
  FROM [dbo].[EstadosCubiculo]
  WHERE [descripcion] != 'Eliminado';`
  consulta.query(query, (err, resultado) => {
    if (err) {
        console.log(err);
        res.status(500).send('Error al realizar la consulta');
    } else {
        res.send({estados: resultado.recordset.map((r) => r.descripcion)});
    }
  });
});

//Ruta para los servicios de los cubículos
router.get('/servicios', (req, res) => {
  const consulta = new sqlcon.Request();
  const query = `
  SELECT [descripcion]
  FROM [dbo].[ServiciosEspeciales];`
  consulta.query(query, (err, resultado) => {
    if (err) {
        console.log(err);
        res.status(500).send('Error al realizar la consulta');
    } else {
        res.send({servicios: resultado.recordset.map((r) => r.descripcion)});
    }
  });
});

//ruta de 1 cubiculo
//retorna una lista cubiculos, esta contiene el nombre, el estado, la capacidad y una lista de servicios especiales
router.get('/cubiculo', (req, res) => {
  const cubID = req.query.id;
  const consulta = new sqlcon.Request();
  const query = `SELECT
                    C.id,
                    C.nombre, 
                    EC.descripcion AS estado, 
                    C.capacidad, 
                    SE.descripcion AS servicio,
                    CASE
                    WHEN EXISTS(
                        SELECT  SdC.[id]
                        FROM    [dbo].[ServiciosDeCubiculo] SdC
                        WHERE   SdC.[idCubiculo] = C.[id]
                            AND SdC.[idServiciosEspeciales] = SE.[id]
                            AND SdC.[activo] = 1
                    )   THEN 1
                        ELSE 0
                    END AS 'activo',
                    ( SELECT  COUNT(R.[id])
                      FROM    [dbo].[Reservas] R
                      WHERE   R.[idCubiculo] = C.[id]
                        AND   R.[horaInicio] > GETUTCDATE()
                        AND   R.[activo] = 1) AS 'reservas',
                    C.minutosMax AS 'minutosMaximo'
                  FROM Cubiculos AS C
                  CROSS JOIN ServiciosEspeciales SE
                  LEFT JOIN EstadosCubiculo AS EC ON C.idEstado = EC.id
                WHERE C.id =` + cubID + `;`;
  
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
              let servicio = {
                nombre: cubiculo.servicio,
                activo: ((cubiculo.activo == 1) ? true : false)
              };

              if (cubiculos[idCubiculo]) {
                  cubiculos[idCubiculo].servicios.push(servicio);
              } else {
                  const { id, nombre, capacidad, estado, reservas, minutosMaximo } = cubiculo;
                  cubiculos[idCubiculo] = {
                      id,
                      nombre,
                      capacidad,
                      estado,
                      reservas,
                      minutosMaximo,
                      servicios: ((servicio) ? [servicio] : [])
                      /* Cuando no hay servicios, da un arreglo vacío
                      en lugar de un arreglo con un elemento nulo */
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

  const horaInicio =  req.query.horaInicio;
  const horaFin = req.query.horaFin;
  console.log(req.query)
  const consulta = new sqlcon.Request();
  const query = `
      SELECT  C.[id],
      C.[nombre],
      EC.[descripcion] AS [estado],
      C.[capacidad],
      C.[minutosMax],
      SE.[descripcion] AS [servicio]
      FROM    [dbo].[Cubiculos] AS C
      INNER JOIN  [dbo].[EstadosCubiculo] EC ON  EC.[id] = C.[idEstado]
      LEFT JOIN ServiciosDeCubiculo AS SC ON C.[id] = SC.idCubiculo AND SC.activo = 1 
      LEFT JOIN ServiciosEspeciales AS SE ON SC.idServiciosEspeciales = SE.id
      WHERE   EC.[descripcion] = 'Habilitado'
      AND
      (   SELECT COUNT(*)
      FROM    [dbo].[Reservas] R
      WHERE   R.[idCubiculo] = C.[id]
          AND R.[activo] = 1
          AND
          (
              (
                  '${horaInicio}' >= R.[horaInicio]
              AND '${horaInicio}' < R.[horaFin]
              )
              OR
              (
                '${horaFin}' > R.[horaInicio]
              AND '${horaFin}' <= R.[horaFin]
              )
              OR
              (
                  R.[horaInicio] > '${horaInicio}'
              AND R.[horaInicio] < '${horaFin}'
              )
              OR
              (
                  R.[horaFin] > '${horaInicio}'
              AND R.[horaFin] < '${horaFin}'
              )
          )
        ) < 1;`;
  
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
                const { id, nombre, estado, capacidad, minutosMax, servicio } = cubiculo;

                cubiculos[idCubiculo] = {
                    id,
                    nombre,                    
                    estado,
                    capacidad,
                    minutosMax,
                    servicios: ((servicio) ? [servicio] : [])
                    /* Cuando no hay servicios, da un arreglo vacío
                    en lugar de un arreglo con un elemento nulo */
                };
            }
        }

        // Convertir objetos a array
        const resultadoFinal = Object.values(cubiculos);

        res.send(resultadoFinal);
      }
  });
});



//ruta de reservas 
//retorna una lista de reservas, esta contiene el id de reserva, el nombre, la capacidad y la fecha y hora de reserva
router.get('/reservas', (req, res) => {
  // Crear una nueva consulta a la base de datos
  const consulta = new sqlcon.Request();
  var query = `SELECT R.id,
                C.[nombre] nombreCubiculo, 
                C.[id] idCubiculo, 
                R.fecha AS fecha,
                R.horaInicio AS horaInicio,
                R.horaFin AS horaFin,
                R.activo AS activo,
                R.confirmado AS confirmado,
                CONCAT(E.[nombre], ' ', E.[apellido1], ' ', E.[apellido2]) AS nombreEstudiante,
                E.[id] AS idEstudiante
              FROM Reservas AS R 
              LEFT JOIN Cubiculos AS C ON R.idCubiculo = C.id
              INNER JOIN [dbo].[Estudiantes] E ON E.[id] = R.[idEstudiante];`

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
//ruta de reservas 
//Reservasd de 1 cubiculo (por nombre)
router.get('/reservas/cubiculo', (req, res) => {
  const cubNombre = req.query.nombre;
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
              WHERE R.activo = 1 AND C.nombre = '${cubNombre}'`

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
  const id = req.query.id;
  // Crear una nueva consulta a la base de datos
  const consulta = new sqlcon.Request();
    var query = `SELECT R.id,
                        C.nombre, 
                        C.capacidad,
                        R.activo,
                        R.confirmado,
                        R.fecha AS fecha,
                          R.horaInicio AS horaInicio,
                          R.horaFin AS horaFin
                    FROM Reservas AS R 
                    INNER JOIN Cubiculos AS C ON R.idCubiculo = C.id
                    WHERE R.idEstudiante = '${id}'
                    ORDER BY Activo DESC, Confirmado ASC`

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



//prueba para el correo
router.get('/correo', (req, res) => {
  const correo = req.query.correo;
  const clave = req.query.clave;
  const fecha = '2020-15-20'
  const horaInicio = '10:00:00'
  const horaFin = '11:00:00'
  const cubiculo = 2
  const id = 1
  // Crear una nueva consulta a la base de datos
  const qrInfo = `id=${id}&fecha=${fecha}&horaInicio=${horaInicio}&horaFin=${horaFin}&cubiculo=${cubiculo}&clave=${clave}`;
  // Crea el código QR con la información deseada
  qr.toDataURL(qrInfo, function (err, url) {

    if (err) throw err;

    let  mailOptions = {
    from: mail,
    to: `efmz2000@outlook.es` ,
    subject: 'inicio de sesion exitoso',
    html: `Contenido del correo
          <img src="${url}"/>`, // Agrega el código QR a la plantilla de correo electrónico
    };
    
    
    console.log(mailOptions)

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        res.status(500).send('Error al enviar el correo');
      } else {
        console.log('Correo enviado: ' + info.response);
        res.send('Correo enviado');
      }

    
    
    });  
  });
});
//Rutas PUT
// "Eliminar"

//eliminar reserva
router.put('/reserva/eliminar', (req, res) => {
  const idReserva = req.query.id;
  const consulta = new sqlcon.Request();
  const query = `UPDATE Reservas SET activo = 0, confirmado = 0 WHERE id =` + idReserva;

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

//confirmar reserva
router.put('/reserva/confirmar', (req, res) => {
  const saved = req.session.user;
  const idReserva = req.query.id;
  const nombre = req.query.nombre;
  const horaInicio = req.query.horaInicio;
  const horaFin = req.query.horaFin;
  const estudiante = saved.idEstudiante;
  const fecha = new Date();
  const email = saved.email;
  const consulta = new sqlcon.Request();
  const query = `UPDATE Reservas SET confirmado = 1 WHERE id =` + idReserva;

  consulta.query(query, (err, resultado) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error al realizar la consulta');
    } else {
      res.send(resultado.recordset);
      console.log('Consulta realizada');
      const stJson = JSON.stringify({idReserva,nombre,fecha,estudiante})

      qr.toDataURL(stJson,(err,url)=>{

        const mailOptions = {
          from: mail,
          to: `${email}` ,
          subject: 'Confirmación de Reserva',
          html:`<p>Se ja confirmado su reserva para el cubículo: ${nombre}
          para la fecha:
          Desde ${horaInicio} hasta ${horaFin}</p>
          <img src='${url}'/>`
        };
        
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Correo enviado: ' + info.response);
          }
        });
      })
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
  const query = `
  UPDATE Cubiculos SET idEstado = 5 WHERE id ='${idCubiculo}';
  SELECT    U.[correo]
  FROM      [dbo].[Usuarios] U
  INNER JOIN    [dbo].[Estudiantes] E
    ON  E.[idUsuario] = U.[id]
  INNER JOIN    [dbo].[Reservas] R
    ON  R.[idEstudiante] = E.[id]
  WHERE R.[idCubiculo] = '${idCubiculo}'
    AND R.[activo] = 1
    AND R.[horaInicio] > GETUTCDATE();
  UPDATE  R
  SET     R.[activo] = 0,
          R.[confirmado] = 0
  FROM    [dbo].[Reservas] R
  WHERE R.[idCubiculo] = '${idCubiculo}'
    AND R.[horaInicio] > GETUTCDATE();`;

  consulta.query(query, (err, resultado) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error al realizar la consulta');
    } else {
      const salidaCorreos = resultado.recordset.map((s) => s.correo);
      if (salidaCorreos.length > 0) {
        const textoCorreo = `Hola:

Se han hecho cambios en un cubículo, lo cual ocasionó que se cancelara su reserva.

Puede hacer otra reserva a través del sitio web.`;

        const mailOptions = {
          from: mail,
          bcc: salidaCorreos ,
          subject: 'Actualización de cubículo',
          text: textoCorreo
        };
        
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Correo enviado: ' + info.response);
          }
        });
      }
      res.status(200).send({});
      console.log('Consulta realizada');
    }
  });
});

// update
router.put("/cubiculo", (req, res) => {
  /* Si todo sale bien, no retorna nada (código 200).
     Si hay un error con los datos de entrada, devuelve JSON con esta estructura:
      {
        errores:  ['error 1', 'error 2', ...]
      }
      (la idea es mostrar los errores al usuario)
  */
  const cuerpo = req.body;
  const id = cuerpo.idCubiculo;
  const servicios = cuerpo.servicios;
  const capacidad = cuerpo.capacidad;
  const nombre = cuerpo.nombre;
  const estado = cuerpo.estado;
  const cancelarReservas = cuerpo.cancelarReservas;
  const minutosMaximo = cuerpo.minutosMaximo;
  const notificarUsuarios = cuerpo.notificarUsuarios;

  if (!cuerpo || !id || !servicios || !capacidad || !nombre || !estado
      || minutosMaximo == null || minutosMaximo == undefined || !(minutosMaximo == parseInt(minutosMaximo).toString())
      || !(capacidad == parseInt(capacidad).toString()) || !(id == parseInt(id).toString()) || cancelarReservas == null
      || cancelarReservas == undefined || notificarUsuarios == undefined) {
    res.status(401).send({ errores : ['Datos incorrectos'] });
  }

  let serviciosString;

  try {
    serviciosString = servicios.map(x => "('" + x.nombre + "', '" + ((x.activo) ? "1" : "0") + "')").join(', ')
  } catch (error) {
    res.status(401).send({ errores : ['Datos incorrectos'] });
  }
  const consulta = new sqlcon.Request();

  const query = `
  -- ----- ENTRADAS ----

  DECLARE @idCubiculo INT = '${id}';
  DECLARE @nombreNuevo VARCHAR(16) = '${nombre}';
  DECLARE @capacidad INT = '${capacidad}';
  DECLARE @estadoNuevo VARCHAR(32) = '${estado}';
  DECLARE @cancelarReservas BIT = '${((cancelarReservas) ? '1' : '0')}';
  DECLARE @minutosMaximo INT = '${minutosMaximo}';

  DECLARE @tmpServicios TABLE (
      descripcion VARCHAR(32) NOT NULL,
      activo BIT NOT NULL
  );
  INSERT INTO @tmpServicios ([descripcion], [activo])
  VALUES  ${serviciosString};

  DECLARE @salida TABLE (
      error VARCHAR(64) NULL,
      correo VARCHAR(128) NULL
  );
  DECLARE @idEstadoNuevo INT;

  -- ----- VARIABLES DE CONTROL -----
  DECLARE @nombreCambia BIT = 0;
  DECLARE @capacidadCambia BIT = 0;
  DECLARE @estadoCambia BIT = 0;
  DECLARE @tiempoCambia BIT = 0;

  -- ----- CAMBIO DE NOMBRE -----

  IF @nombreNuevo != (  SELECT  C.[nombre]
                        FROM    [dbo].[Cubiculos] C
                        WHERE   C.[id] = @idCubiculo)
  BEGIN
    -- El nombre cambió
    IF EXISTS(  SELECT  C.[nombre]
                FROM    [dbo].[Cubiculos] C
                INNER JOIN [dbo].[EstadosCubiculo] EC
                    ON  C.[idEstado] = EC.[id]
                WHERE   C.[nombre] = @nombreNuevo
                    AND EC.[descripcion] != 'Eliminado')
    BEGIN
        -- Ya hay un cubículo con el mismo nombre
        INSERT INTO @salida ([error])
        VALUES  ('Ya existe un cubículo con ese nombre');
    END
    ELSE
    BEGIN
        -- No hay un cubículo con el mismo nombre
        SET @nombreCambia = 1;
    END;
  END;

  -- ----- CAMBIO DE CAPACIDAD -----

  IF @capacidad != (SELECT  C.[capacidad]
                    FROM    [dbo].[Cubiculos] C
                    WHERE   C.[id] = @idCubiculo)
  BEGIN
    -- La capacidad cambió
    IF @capacidad > 0
    BEGIN
        SET @capacidadCambia = 1;
    END
    ELSE
    BEGIN
        INSERT INTO @salida ([error])
        VALUES  (CONCAT(CONVERT(VARCHAR, @capacidad), ' no es una capacidad válida'));
    END;
  END;

  -- ----- CAMBIO DE TIEMPO -----

  IF @minutosMaximo != (SELECT  C.[minutosMax]
                        FROM    [dbo].[Cubiculos] C
                        WHERE   C.[id] = @idCubiculo)
  BEGIN
    -- La capacidad cambió
    SET @tiempoCambia = 1;
  END;

  -- ----- CAMBIO DE ESTADO -----

  IF @estadoNuevo != (  SELECT  EC.[descripcion]
                        FROM    [dbo].[Cubiculos] C
                        INNER JOIN  [dbo].[EstadosCubiculo] EC
                            ON  C.[idEstado] = EC.[id]
                        WHERE   C.[id] = @idCubiculo )
  BEGIN
    -- El estado cambió

    IF EXISTS(  SELECT  EC.[id]
                FROM    [dbo].[EstadosCubiculo] EC
                WHERE   EC.[descripcion] = @estadoNuevo
                    AND EC.[descripcion] != 'Eliminado' )
    BEGIN
        SET @estadoCambia = 1;
        SET @idEstadoNuevo = (
                SELECT  EC.[id]
                FROM    [dbo].[EstadosCubiculo] EC
                WHERE   EC.[descripcion] = @estadoNuevo );
    END
    ELSE
    BEGIN
        INSERT INTO @salida ([error])
        VALUES  ('El estado no existe');
    END;
  END;

  IF (  SELECT  COUNT(*)
        FROM    @salida ) > 0
  BEGIN
    -- Hubo un error
    SELECT  S.[error]
    FROM    @salida S;
    RETURN;
  END;

  BEGIN TRY

      BEGIN TRANSACTION tActualizarCubiculo

          -- ----- CAMBIO DE NOMBRE -----
          IF @nombreCambia = 1
          BEGIN
            UPDATE  C
            SET     C.[nombre] = @nombreNuevo
            FROM    [dbo].[Cubiculos] C
            WHERE   C.[id] = @idCubiculo;
          END;

          -- ----- CAMBIO DE CAPACIDAD -----
          IF @capacidadCambia = 1
          BEGIN
            UPDATE  C
            SET     C.[capacidad] = @capacidad
            FROM    [dbo].[Cubiculos] C
            WHERE   C.[id] = @idCubiculo;
          END;

          -- ----- CAMBIO DE TIEMPO -----
          IF @tiempoCambia = 1
          BEGIN
            UPDATE  C
            SET     C.[minutosMax] = @minutosMaximo
            FROM    [dbo].[Cubiculos] C
            WHERE   C.[id] = @idCubiculo;
          END;

          -- ----- CAMBIO DE ESTADO -----
          IF @estadoCambia = 1
          BEGIN
            UPDATE  C
            SET     C.[idEstado] = @idEstadoNuevo
            FROM    [dbo].[Cubiculos] C
            WHERE   C.[id] = @idCubiculo;
          END;

          -- ----- CAMBIO DE SERVICIOS -----

          -- Se desactivan los servicios que se cambiaron de 1 a 0

          UPDATE  SdC
          SET     SdC.[activo] = 0
          FROM    [dbo].[ServiciosDeCubiculo] SdC
          INNER JOIN  [dbo].[ServiciosEspeciales] SE
              ON  SE.[id] = SdC.[idServiciosEspeciales]
          INNER JOIN  @tmpServicios tS
              ON  tS.[descripcion] = SE.[descripcion]
          WHERE   tS.[activo] = 0
              AND SdC.[activo] = 1
              AND SdC.[idCubiculo] = @idCubiculo;

          -- Se reactivan los servicios que cambiaron de 0 a 1

          UPDATE  SdC
          SET     SdC.[activo] = 1
          FROM    [dbo].[ServiciosDeCubiculo] SdC
          INNER JOIN  [dbo].[ServiciosEspeciales] SE
              ON  SE.[id] = SdC.[idServiciosEspeciales]
          INNER JOIN  @tmpServicios tS
              ON  tS.[descripcion] = SE.[descripcion]
          WHERE   tS.[activo] = 1
              AND SdC.[activo] = 0
              AND SdC.[idCubiculo] = @idCubiculo;

          -- Se agregan los servicios que no se hayan agregado antes

          INSERT INTO [dbo].[ServiciosDeCubiculo]
          (
              [idCubiculo],
              [idServiciosEspeciales],
              [activo]
          )
          SELECT  @idCubiculo,
                  SE.[id],
                  1
          FROM    [dbo].[ServiciosEspeciales] SE
          INNER JOIN  @tmpServicios tS
              ON  tS.[descripcion] = SE.[descripcion]
              AND tS.[activo] = 1
          WHERE NOT EXISTS(
              SELECT  1
              FROM    [dbo].[ServiciosDeCubiculo] SdC
              WHERE   SdC.[idServiciosEspeciales] = SE.[id]
                  AND SdC.[idCubiculo] = @idCubiculo
          );

          -- Se guardan los correos de quienes tienen reservas

          INSERT INTO @salida ([correo])
          SELECT    U.[correo]
          FROM      [dbo].[Usuarios] U
          INNER JOIN    [dbo].[Estudiantes] E
            ON  E.[idUsuario] = U.[id]
          INNER JOIN    [dbo].[Reservas] R
            ON  R.[idEstudiante] = E.[id]
          WHERE R.[idCubiculo] = @idCubiculo
            AND R.[activo] = 1
            AND R.[horaInicio] > GETUTCDATE();

          -- Se desactivan las reservas en caso de haberse seleccionado la opción

          IF @cancelarReservas = 1
          BEGIN
            UPDATE  R
            SET     R.[activo] = 0,
                    R.[confirmado] = 0
            FROM    [dbo].[Reservas] R
            WHERE R.[idCubiculo] = @idCubiculo
              AND R.[horaInicio] > GETUTCDATE();
          END;

          COMMIT TRANSACTION tActualizarCubiculo;

  END TRY
  BEGIN CATCH
    
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION tActualizarCubiculo;
    END;

    INSERT INTO @salida ([error])
    VALUES  ('Error interno del servidor');

  END CATCH;

  SELECT  S.[error],
          S.[correo]
  FROM    @salida S;`;
  
  consulta.query(query, (err, resultado) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error al realizar la consulta');
    } else {
      if (resultado.recordset.filter((e) => e.error != null).length > 0) {
        const salidaErrores = resultado.recordset.filter((e) => e.error != null);
        let errores = []
        for (let i = 0; i < salidaErrores.length; i++) {
          errores.push(salidaErrores[i].error);
        }
        res.status(401).send({ errores : errores });
      } else {
        const salidaCorreos = resultado.recordset.filter((e) => e.correo != null).map((s) => s.correo);
        if (notificarUsuarios) {
          let textoCorreo = '';
          if (cancelarReservas) {
            textoCorreo = `Hola:

Se han hecho cambios en el cubículo ${nombre}, lo cual ocasionó que se cancelara su reserva.

Puede hacer otra reserva a través del sitio web.`;
          } else {
            const serviciosActivos = servicios.filter((s) => s.activo).map((se) => se.nombre);
            textoCorreo = `Hola:

Se han hecho cambios en el cubículo ${nombre}, para el cual usted tiene una reserva activa.

La nueva información del cubículo es la siguiente:
- Nombre: ${nombre}
- Capacidad: ${capacidad + ' ' + ((capacidad == 1) ? 'persona' : 'personas')}
- Estado: ${estado}
- Servicios disponibles:${(serviciosActivos.length > 0 ? (serviciosActivos.map((se, ind) => (" " + (ind + 1) + ". " + se))) : " Ninguno")}
- Tiempo máximo de uso: ${minutosMaximo} minutos

Su reserva sigue activa. Puede hacer cambios a sus reservas ingresando al sitio web.`;
          }

          const mailOptions = {
            from: mail,
            bcc: salidaCorreos ,
            subject: 'Actualización de cubículo',
            text: textoCorreo
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Correo enviado: ' + info.response);
            }
          });
        }
        res.status(200).send({ errores: []});
      }
    }
  });
})

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
          subject: 'Registro Exitoso',
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
        res.status(200).send({message:'Registro Exitoso'});
      }
    });
    })
    
  })

});

router.post('/Reservar/Cubiculo',(req, res)=>{
  const {idCubiculo, IdEstudiante,horaInicio, horaFin, email, nombre} = req.body;

  const query = `INSERT INTO Reservas(idCubiculo, idEstudiante, fecha, horaInicio, horaFin, activo, confirmado)
                 VALUES('${idCubiculo}', '${IdEstudiante}',getUTCDate(),'${horaInicio}','${horaFin}',1,0)`;
  const consulta = new sqlcon.Request();

  consulta.query(query,(err,resultado)=>{
    if(err){
      console.log(err)
      res.status(500).send({message:'Error al registrar la reserva'});
    }else{
      res.send({message:'Se inserto correctamente'})
      
      const mailOptions = {
        from: mail,
        to: `${email}` ,
        subject: 'Reserva de Cubículo',
        html:`<p>Se ha reservado el cubículo: ${nombre}
        para la fecha:
        Desde ${horaInicio} hasta ${horaFin}</p>
        Para solicitar el QR de la reserva debe confirmarla desde la pagina.`
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Correo enviado: ' + info.response);
        }
      });
    }
    
  })
})

//Crear Cubiculo
router.post('/cubiculo/crear', (req, res) => {
  const bod = req.body;
  const idEstado = bod.idEstado;
  const nombre = bod.nombre;
  const capacidad = bod.capacidad;
  const minutosMax = bod.minutosMax;

  const queryI = `
  INSERT INTO Cubiculos (
    idEstado,
    nombre,
    capacidad,
    minutosMax)
  VALUES (
    '${idEstado}',
    '${nombre}',
    '${capacidad}',
    '${minutosMax}')
  `
  const insertar = new sqlcon.Request();

  insertar.query(queryI, (err, resultado)=>{
    if (err) {
      res.status(500).send({message:'Error al registrar cubiculo'});
    } else {
      res.status(200).send({message:'Registro Exitoso'});
    }
  });


});

module.exports = router;