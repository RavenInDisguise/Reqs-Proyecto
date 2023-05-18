var express = require('express');
import sqlcon from './database';
var router = express.Router();
import {estaAutenticado} from "./autenticado"

//retorna una lista cubiculos, esta contiene el nombre, el estado, la capacidad y una lista de servicios especiales
router.get('/cubiculos', (req, res) => {
    if (!estaAutenticado(req, true)) {
        return res.status(403).send('Acceso denegado');
    }
    const soloNombre = req.query.soloNombre;
    const consulta = new sqlcon.Request();
    const query = (soloNombre ? `SELECT C.id, C.nombre
                    FROM Cubiculos AS C
                    INNER JOIN EstadosCubiculo AS EC ON C.idEstado = EC.id
                    WHERE EC.[descripcion] = 'Habilitado'` : `SELECT C.id, C.nombre, EC.descripcion AS estado, C.capacidad, SE.descripcion AS servicio 
                    FROM Cubiculos AS C 
                    LEFT JOIN EstadosCubiculo AS EC ON C.idEstado = EC.id 
                    LEFT JOIN ServiciosDeCubiculo AS SC ON C.id = SC.idCubiculo AND SC.activo = 1 
                    LEFT JOIN ServiciosEspeciales AS SE ON SC.idServiciosEspeciales = SE.id;`);

    consulta.query(query, (err, resultado) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error al realizar la consulta');
        } else {
            const cubiculos = {};

            // Agrupar servicios por cubículo
            if (soloNombre) {
                for (let i = 0; i < resultado.recordset.length; i++) {
                const cubiculo = resultado.recordset[i];
                const idCubiculo = cubiculo.id;

                const { id, nombre } = cubiculo;

                cubiculos[idCubiculo] = {
                    id,
                    nombre
                };
                }
            } else {
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
    if (!estaAutenticado(req, true)) {
        return res.status(403).send('Acceso denegado');
    }
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
    if (!estaAutenticado(req, false)) {
        return res.status(403).send('Acceso denegado');
    }
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
    if (!estaAutenticado(req, false)) {
      return res.status(403).send('Acceso denegado');
    }
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
    if (!estaAutenticado(req, false)) {
      return res.status(403).send('Acceso denegado');
    }
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

  //eliminar cubiculo 
router.put("/cubiculo/eliminar",(req,res) =>{
    if (!estaAutenticado(req, true)) {
      return res.status(403).send('Acceso denegado');
    }
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
    if (!estaAutenticado(req, true)) {
      return res.status(403).send('Acceso denegado');
    }
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

  router.post('/api/Reservar/Cubiculo',(req, res)=>{
    if (!estaAutenticado(req, false)) {
      return res.status(403).send('Acceso denegado');
    }
    const {idCubiculo, IdEstudiante,horaInicio, horaFin, email, nombre} = req.body;
  
    const query = `INSERT INTO Reservas(idCubiculo, idEstudiante, fecha, horaInicio, horaFin, activo, confirmado)
                   VALUES('${idCubiculo}', '${IdEstudiante}',getUTCDate(),'${horaInicio}','${horaFin}',1,0)`;
    const consulta = new sqlcon.Request();
  
    consulta.query(query,(err,resultado)=>{
      if(err){
        console.log(err)
        res.status(500).send({message:'Error al registrar la reserva'});
      }else{
        res.send({message:'Reserva registrada existosamente'})
        
        const mailOptions = {
          from: mail,
          to: `${email}` ,
          subject: 'Reserva de cubículo',
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
  router.put('/cubiculo/crear', (req, res) => {
    if (!estaAutenticado(req, true)) {
      return res.status(403).send('Acceso denegado');
    }
    const bod = req.body;
    const idEstado = bod.estadoActual;
    const nombre = bod.nombre;
    const servicios = bod.servicios;
    let capacidad = bod.capacidad;
    let minutosMax = bod.tiempoMaximo;
    let idFinal = 2;
    console.log("Valor de tiempo", minutosMax);
    //convertir a entero la capacidad y el tiempo
    capacidad = parseInt(capacidad);
    minutosMax = parseInt(minutosMax);
  
    //id para estado
    switch (idEstado) {
      case "Habilitado":
        idFinal = 2;
        break;
      case "Ocupado":
        idFinal = 3;
        break;
      case "En mantenimiento":
        idFinal = 4;
        break;
      default:
        idFinal = 2;
        break;
    }
    console.log("Valor de capacidad", capacidad);
  
    const queryI = `
    INSERT INTO Cubiculos (
      idEstado,
      nombre,
      capacidad,
      minutosMax)
    VALUES (
      '${idFinal}',
      '${nombre}',
      '${capacidad}',
      '${minutosMax}');
  
      DECLARE @idCubiculo INT = SCOPE_IDENTITY() ;
      
      DECLARE @serviciosNuevos TABLE (
        [servicioNombre] VARCHAR(32)
      )
  
      INSERT INTO @serviciosNuevos ([servicioNombre])
      VALUES ${servicios.map((s) => ("('" + s + "')")).join(',')};
  
      INSERT INTO [ServiciosDeCubiculo]
      (
        [idCubiculo],
        [idServiciosEspeciales],
        [activo]
      )
      SELECT  @idCubiculo,
              SE.[id],
              1
      FROM    [ServiciosEspeciales] SE
      INNER JOIN @serviciosNuevos SN
        ON    SE.[descripcion] = SN.[servicioNombre];
    `
    const insertar = new sqlcon.Request();
  
    insertar.query(queryI, (err, resultado)=>{
      if (err) {
        console.log(err);
        res.status(500).send({message:'Error al registrar cubiculo'});
      } else {
        res.status(200).send({message:'Registro exitoso'});
      }
    });
  }); 

  module.exports = router;