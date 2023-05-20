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

// Eliminar reserva
router.put('/eliminar', (req, res) => {
    if (!estaAutenticado(req, false)) {
        return res.status(403).send('Acceso denegado');
    }
    const idReserva = req.query.id;
    const idEstudiante = req.session.user.idEstudiante;
    const tipoUsuario = req.session.user.tipoUsuario;
    
    const request = new sqlcon.Request();

    // Parámetros de entrada
    request.input('IN_idReserva', sqlcon.Int, idReserva);
    request.input('IN_idEstudiante', sqlcon.Int, idEstudiante);
    request.input('IN_tipoUsuario', sqlcon.VarChar, tipoUsuario);

    request.execute('BiblioTEC_SP_EliminarReserva', (error, resultado) => {
        if (error) {
            manejarError(res, error);
        } else {
            res.status(200).send();
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
    const request = new sqlcon.Request();
    request.input('IN_idReserva', sqlcon.Int, idReserva)
    request.input('IN_idEstudiante', sqlcon.Int, req.session.user.idEstudiante)
    request.input('IN_tipoUsuario', sqlcon.VarChar, req.session.user.tipoUsuario)
  
    request.execute('Bibliotec_SP_ConfirmarReserva',(error, resultado) => {
      if (error) {
        manejarError(res,error)
      } else {
        
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

        res.status(200).send()
      }
    });
  });
  
// Actualizar reserva
router.put('/', (req, res) => {
    if (!estaAutenticado(req, true)) {
        return res.status(403).send('Acceso denegado');
    }
    const cuerpo = req.body;
    const request = new sqlcon.Request();

    // Parámetros de entrada
    request.input('IN_idReserva', sqlcon.Int, cuerpo.id);
    request.input('IN_idCubiculo', sqlcon.Int, cuerpo.idCubiculo)
    request.input('IN_idEstudiante', sqlcon.Int, cuerpo.idEstudiante)
    request.input('IN_horaInicio', sqlcon.VarChar, cuerpo.horaInicio)
    request.input('IN_horaFin', sqlcon.VarChar, cuerpo.horaFin)
    request.input('IN_activo', sqlcon.Bit, cuerpo.activo)
    request.input('IN_confirmado', sqlcon.Bit, cuerpo.confirmado)

    request.execute('BiblioTEC_SP_ActualizarReserva', (error, resultado) => {
        if (error) {
            manejarError(res, error);
        } else {
            res.status(200).send();
        }
    });
});

module.exports = router;