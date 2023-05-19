let express = require('express');
const sqlcon = require('./database.js')
let router = express.Router();
let estaAutenticado = require('./autenticado.js')
const { PDFDocument, StandardFonts } = require('pdf-lib');
let transporter = require('./correo.js');
let qr = require('qrcode');
const manejarError = require('./errores.js');

// Datos de una reserva
router.get('/', (req, res) => {
    if (!estaAutenticado(req, true)) {
        return res.status(403).send('Acceso denegado');
    }

    const request = new sqlcon.Request();

    request.input('IN_idReserva', sqlcon.Int, req.query.idReserva);

    // Ejecutar la consulta
    request.execute('BiblioTEC_SP_ObtenerReserva', (error, resultado) => {
        if (error) {
            manejarError(res, error);
        } else {
            res.send(resultado.recordset);
        }
    });
});
  
// Ruta de reservas 
// Retorna la lista de reservas, esta contiene el id de reserva, el nombre, la capacidad y la fecha y hora de reserva
router.get('/reservas', (req, res) => {
    if (!estaAutenticado(req, true)) {
        return res.status(403).send('Acceso denegado');
    }

    const request = new sqlcon.Request();

    // Ejecutar la consulta
    request.execute('BiblioTEC_SP_ObtenerReservas', (error, resultado) => {
        if (error) {
            manejarError(res, error);
        } else {
            res.send(resultado.recordset);
            console.log('Consulta realizada');
        }

    });
});

// Ruta de reseervas de estudiante
// Retorna una lista de reservas realizadas por un estudiante, 
// Esta contiene eel id de reserva, el nombre, 
// la capacidad y la fecha y hora de reserva
router.get('/estudiante', (req, res) => {
    const id = req.query.id;
    if (!estaAutenticado(req, true, id)) {
        return res.status(403).send('Acceso denegado');
    }
    // Crear una nueva consulta a la base de datos
    const request = new sqlcon.Request();

    request.input('IN_idEstudiante', sqlcon.Int, id);

    // Ejecutar la consulta
    request.execute('BiblioTEC_SP_ObtenerReservasDeEstudiante', (error, resultado) => {
        if (error) {
            manejarError(res, error);
        } else {
            res.send(resultado.recordset);
        }
    });
});

//eliminar reserva
router.put('/eliminar', (req, res) => {
    if (!estaAutenticado(req, false)) {
      return res.status(403).send('Acceso denegado');
    }
    const idReserva = req.query.id;
    const consulta = new sqlcon.Request();
    const query = (req.session.user.tipoUsuario == 'Administrador' ? 
      `UPDATE Reservas SET activo = 0, confirmado = 0 WHERE idEstudiante = ${req.session.user.idEstudiante} AND id =` + idReserva
      : `UPDATE Reservas SET activo = 0, confirmado = 0 WHERE id =` + idReserva)
  
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
  router.put('/confirmar', async (req, res) => {
    if (!estaAutenticado(req, false)) {
      return res.status(403).send('Acceso denegado');
    }
    const saved = req.session.user;
    const idReserva = req.query.id;
    const nombre = req.query.nombre;
    const horaInicio = req.query.horaInicio;
    const horaFin = req.query.horaFin;
    const estudiante = saved.idEstudiante;
    const fecha = new Date();
    const email = saved.email;
    const consulta = new sqlcon.Request();
    const query = (req.session.user.tipoUsuario == 'Administrador' ? 
      `UPDATE Reservas SET confirmado = 1 WHERE idEstudiante = ${req.session.user.idEstudiante} AND id =` + idReserva
      : `UPDATE Reservas SET confirmado = 1 WHERE id =` + idReserva)
  
    consulta.query(query,(err, resultado) => {
      if (err) {
        console.log(err);
        res.status(500).send('Error al realizar la consulta');
      } else {
        res.send(resultado.recordset);
        console.log('Consulta realizada');
        const stJson = JSON.stringify({idReserva,nombre,fecha,estudiante})
  
        //creacion del qr
        qr.toDataURL(stJson, async(err,url)=>{
  
          const pdfDoc = await PDFDocument.create();
          const page = pdfDoc.addPage([612, 792]);
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
          //configuracion del pdf
          const response = await fetch(url);
          const imageBytes = await response.arrayBuffer();
  
          //insersion qr y texto en el pdf 
          const qrImage = await pdfDoc.embedPng(imageBytes);
          const qrDims = qrImage.scale(3);
          const text = `Se ha confirmado su reserva para el cubículo: ${nombre}\nPara la fecha: ${fecha}\nDesde ${horaInicio} hasta ${horaFin}`;
          page.drawText(text, { x: 50, y: 700, font, size: 24 });
          page.drawImage(qrImage, { x: 50, y: 200, width: qrDims.width, height: qrDims.height });
  
          //guardado del pdf
          const pdfBytes = await pdfDoc.save();
  
          const mailOptions = {
            from: transporter.options.auth.user,
            to: `${email}`,
            subject: 'Confirmación de Reserva',
            html: `<p>Se ha confirmado su reserva para el cubículo: ${nombre}\nPara la fecha: ${fecha}\nDesde ${horaInicio} hasta ${horaFin}</p><img src='${url}'/>`,
            attachments: [{
              filename: 'Confirmación.pdf',
              content: pdfBytes,
              contentType: 'application/pdf',
            }],
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
  
  //actualizar reserva
  router.put('/', (req, res) => {
    if (!estaAutenticado(req, true)) {
      return res.status(403).send('Acceso denegado');
    }
    const cuerpo = req.body;
    const consulta = new sqlcon.Request();
    
    const query = `DECLARE @idReserva INT = '${cuerpo.id}';
    DECLARE @idCubiculo INT = '${cuerpo.idCubiculo}';
    DECLARE @idEstudiante INT = '${cuerpo.idEstudiante}';
    DECLARE @horaInicio DATETIME = '${cuerpo.horaInicio}';
    DECLARE @horaFin DATETIME = '${cuerpo.horaFin}';
    DECLARE @activo BIT = '${(cuerpo.activo) ? '1' : '0'}';
    DECLARE @confirmado BIT = '${(cuerpo.confirmado) ? '1' : '0'}';
    
    DECLARE @salida TABLE (
        [error] VARCHAR(128)
    );
    
    -- COMPROBACIONES
    
    -- Comprobación de la fecha
    
    IF @horaFin <= @horaInicio
    BEGIN
        INSERT INTO @salida ([error])
        VALUES ('La hora final no puede ser menor o igual que la inicial');
    END;
    
    IF (@horaInicio < GETUTCDATE() OR @horaFin < GETUTCDATE())
    BEGIN
        INSERT INTO @salida ([error])
        VALUES ('Al menos una de las horas indicadas ya pasó');
    END;
    
    -- Comprobación del cubículo
    
    IF (SELECT  R.[idCubiculo]
        FROM    [dbo].[Reservas] R
        WHERE   R.[id] = @idReserva) != @idCubiculo
    BEGIN
        -- Cambió el ID del cubículo
        IF NOT EXISTS(  SELECT  1
                    FROM    [dbo].[Cubiculos] C
                    WHERE   C.[id] = @idCubiculo    )
        BEGIN
            -- No existe el cubículo
            INSERT INTO @salida ([error])
            VALUES ('No existe el cubículo proporcionado');
        END;
    END;
    
    -- Comprobación del estudiante
    
    IF (SELECT  R.[idEstudiante]
        FROM    [dbo].[Reservas] R
        WHERE   R.[id] = @idReserva) != @idEstudiante
    BEGIN
        -- Cambió el ID del estudiante
        IF NOT EXISTS(  SELECT  1
                    FROM    [dbo].[Estudiantes] E
                    WHERE   E.[id] = @idEstudiante
                        AND E.[activo] = 1)
        BEGIN
            -- No existe el estudiante
            INSERT INTO @salida ([error])
            VALUES ('El estudiante proporcionado no coincide con un estudiante activo en el sistema');
        END;
    END;
    
    -- Se revisa si hay un choque
    
    -- Choque con otra reserva del mismo cubículo
    
    IF (   SELECT COUNT(*)
    FROM    [dbo].[Reservas] R
    WHERE   R.[idCubiculo] = @idCubiculo
        AND R.[activo] = 1
        AND R.[id] != @idReserva
        AND
        (
            (
                @horaInicio >= R.[horaInicio]
            AND @horaInicio < R.[horaFin]
            )
            OR
            (
            @horaFin > R.[horaInicio]
            AND @horaFin <= R.[horaFin]
            )
            OR
            (
                R.[horaInicio] > @horaInicio
            AND R.[horaInicio] < @horaFin
            )
            OR
            (
                R.[horaFin] > @horaInicio
            AND R.[horaFin] < @horaFin
            )
        )
    ) != 0
    BEGIN
        INSERT INTO @salida ([error])
        VALUES ('Hay un choque con otra reserva activa del cubículo indicado');
    END;
    
    -- Choque con otra reserva del mismo estudiante
    
    IF (   SELECT COUNT(*)
    FROM    [dbo].[Reservas] R
    WHERE   R.[idEstudiante] = @idEstudiante
        AND R.[activo] = 1
        AND R.[id] != @idReserva
        AND
        (
            (
                @horaInicio >= R.[horaInicio]
            AND @horaInicio < R.[horaFin]
            )
            OR
            (
            @horaFin > R.[horaInicio]
            AND @horaFin <= R.[horaFin]
            )
            OR
            (
                R.[horaInicio] > @horaInicio
            AND R.[horaInicio] < @horaFin
            )
            OR
            (
                R.[horaFin] > @horaInicio
            AND R.[horaFin] < @horaFin
            )
        )
    ) != 0
    BEGIN
        INSERT INTO @salida ([error])
        VALUES ('Hay un choque con otra reserva activa del estudiante indicado');
    END;
    
    IF (SELECT  COUNT(*)
        FROM    @salida) = 0
    BEGIN
        UPDATE  R
        SET     R.[idCubiculo] = @idCubiculo,
                R.[idEstudiante] = @idEstudiante,
                R.[horaInicio] = @horaInicio,
                R.[horaFin] = @horaFin,
                R.[activo] = @activo,
                R.[confirmado] = @confirmado
        FROM    [dbo].[Reservas] R
        WHERE   R.[id] = @idReserva;
    END;
    
    SELECT  S.[error]
    FROM    @salida S;`;
  
    consulta.query(query, (err, resultado) => {
      if (err) {
        console.log(err);
        res.status(500).send({errores:['Error desconocido']});
      } else {
        const salida = resultado.recordset;
        if (salida.length > 0) {
          res.status(401).send({errores: salida.map(s => s.error)})
        } else {
          res.status(200).send({});
        }
        console.log('Consulta realizada');
      }
    });
  });

  module.exports = router;