let express = require('express');
const {sqlcon} = require('./database.js');
let router = express.Router();
let estaAutenticado = require('./autenticado.js')
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
let transporter = require('./correo.js');
let qr = require('qrcode');
const manejarError = require('./errores.js');
const fs = require('fs');

// Para el formato de las fechas en el envío de correos
const idiomaLocal = ['es-CR', 'es'];
const formatoFecha = {
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
};
const formatoHora = {
    timeZone: 'America/Costa_Rica',
    hour12: true,
    hour: '2-digit',
    minute: 'numeric'
};

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

// Ruta de reservas de estudiante
// Retorna una lista de reservas realizadas por un estudiante, 
// Esta contiene el id de reserva, el nombre, 
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

// Ruta de reservas del cubículo
// Retorna una lista de reservas realizadas en un cubículo, 
// Esta contiene el id de reserva, el nombre, 
// la capacidad y la fecha y hora de reserva
router.get('/cubiculo', (req, res) => {
    const id = req.query.id;
    if (!estaAutenticado(req, true)) {
        return res.status(403).send('Acceso denegado');
    }
    // Crear una nueva consulta a la base de datos
    const request = new sqlcon.Request();

    request.input('IN_idCubiculo', sqlcon.Int, id);

    // Ejecutar la consulta
    request.execute('BiblioTEC_SP_ObtenerReservasDeCubiculo', (error, resultado) => {
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
  
// Confirmar reserva
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
    let horaInicio_obj, horaFin_obj;

    try {
        horaInicio_obj = new Date(horaInicio);
        horaFin_obj = new Date(horaFin);
    } catch (error) {
        return res.status(401).send({ message : 'Datos erróneos' });
    }
    
    request.input('IN_idReserva', sqlcon.Int, idReserva)
    request.input('IN_idEstudiante', sqlcon.Int, req.session.user.idEstudiante)
    request.input('IN_tipoUsuario', sqlcon.VarChar, req.session.user.tipoUsuario)

    request.execute('Bibliotec_SP_ConfirmarReserva', (error, resultado) => {
        if (error) {
            manejarError(res, error)
        } else {

            const stJson = JSON.stringify({ idReserva, nombre, horaInicio, estudiante })

            // Creación del QR
            qr.toDataURL(stJson, async (err, url) => {

                const pdfDoc = await PDFDocument.create();
                pdfDoc.registerFontkit(fontkit);
                const page = pdfDoc.addPage([612, 300]);

                // Configuración del PDF
                const response = await fetch(url);
                const imageBytes = await response.arrayBuffer();
                const margenLateral = 50;
                const font_size = 14;
                let label_width;

                // Fuentes
                const fontBytes_RobotoSlab = fs.readFileSync('assets/fonts/RobotoSlab-Bold.ttf');
                const RobotoSlab_Ref = await pdfDoc.embedFont(fontBytes_RobotoSlab);

                const fontBytes_Roboto = fs.readFileSync('assets/fonts/Roboto-Regular.ttf');
                const Roboto_Ref = await pdfDoc.embedFont(fontBytes_Roboto);
                const altoLinea = Roboto_Ref.heightAtSize(font_size);

                const fontBytes_RobotoBold = fs.readFileSync('assets/fonts/Roboto-Bold.ttf');
                const RobotoBold_Ref = await pdfDoc.embedFont(fontBytes_RobotoBold);

                // Inserción del QR y del texto en el PDF

                // Inserción del título
                const titulo = 'Confirmación de reserva';
                const titulo_size = 20;
                const titulo_color = rgb(0 / 255, 80 / 255, 133 / 255); // Color de énfasis
                const altoTitulo = RobotoSlab_Ref.heightAtSize(titulo_size);
                let ultimo_inicioY = (page.getHeight() - 40);
                page.drawText(titulo, { x: margenLateral, y: ultimo_inicioY - altoTitulo / 2, size: titulo_size, font: RobotoSlab_Ref, color: titulo_color });

                // Inserción del logo
                const bibliotec = 'BIBLIOTEC';
                const anchoBibliotec = RobotoSlab_Ref.widthOfTextAtSize(bibliotec, titulo_size);
                page.drawText(bibliotec, { x: page.getWidth() - margenLateral - anchoBibliotec, y: ultimo_inicioY - altoTitulo / 2, size: titulo_size, font: RobotoSlab_Ref, color: titulo_color});

                const logoImageBytes = fs.readFileSync('assets/img/logo.png');
                const logoImage = await pdfDoc.embedPng(logoImageBytes);
                const logoDims = logoImage.scale(0.45);
                page.drawImage(logoImage, {
                    x: page.getWidth() - margenLateral - anchoBibliotec - logoDims.width - 7,
                    y: ultimo_inicioY - altoTitulo / 2 - logoDims.height / 2 + 8,
                    width: logoDims.width,
                    height: logoDims.height
                })

                // Inserción del QR
                ultimo_inicioY = ultimo_inicioY - altoTitulo - 30;
                const qrImage = await pdfDoc.embedPng(imageBytes);
                const qrDims = qrImage.scale(1);
                page.drawImage(qrImage, { x: page.getWidth() - qrDims.width - margenLateral + 15, y: ultimo_inicioY - qrDims.height + 15, width: qrDims.width, height: qrDims.height });

                // Inserción de los demás datos
                const mensaje = 'Se ha confirmado su reserva exitosamente.\nLos datos son los siguientes:';
                page.drawText(mensaje, { x: margenLateral, y: ultimo_inicioY, font: Roboto_Ref, size: font_size });
                ultimo_inicioY -= altoLinea;

                const fechaDeReserva_texto = new Intl.DateTimeFormat(idiomaLocal, formatoFecha).format(horaInicio_obj);
                const fechaDeReserva_label = '· Fecha: ';
                ultimo_inicioY = ultimo_inicioY - altoLinea - 20;
                page.drawText(fechaDeReserva_label, { x: margenLateral, y: ultimo_inicioY, font : RobotoBold_Ref, size: font_size });
                label_width = RobotoBold_Ref.widthOfTextAtSize(fechaDeReserva_label, font_size);
                page.drawText(fechaDeReserva_texto, { x: margenLateral + label_width + 5, y: ultimo_inicioY, font : Roboto_Ref, size: font_size });

                // Hay un error que hace que las 12:## a. m. o las 12:## p. m.
                // se muestren como 0:## a. m. o 0:## p. m., entonces para eso es el .replace()
                const horaInicio_texto = new Intl.DateTimeFormat(idiomaLocal, formatoHora).format(horaInicio_obj).replace(/(00)(:\d{2})/, '12$2');
                const horaInicio_label = '· Hora de entrada: ';
                ultimo_inicioY = ultimo_inicioY - altoLinea - 8;
                page.drawText(horaInicio_label, { x: margenLateral, y: ultimo_inicioY, font : RobotoBold_Ref, size: font_size });
                label_width = RobotoBold_Ref.widthOfTextAtSize(horaInicio_label, font_size);
                page.drawText(horaInicio_texto, { x: margenLateral + label_width + 5, y: ultimo_inicioY, font : Roboto_Ref, size: font_size });

                // Hay un error que hace que las 12:## a. m. o las 12:## p. m.
                // se muestren como 0:## a. m. o 0:## p. m., entonces para eso es el .replace()
                const horaFin_texto = new Intl.DateTimeFormat(idiomaLocal, formatoHora).format(horaFin_obj).replace(/(00)(:\d{2})/, '12$2');
                const horaFin_label = '· Hora de salida: ';
                ultimo_inicioY = ultimo_inicioY - altoLinea - 8;
                page.drawText(horaFin_label, { x: margenLateral, y: ultimo_inicioY, font : RobotoBold_Ref, size: font_size });
                label_width = RobotoBold_Ref.widthOfTextAtSize(horaFin_label, font_size);
                page.drawText(horaFin_texto, { x: margenLateral + label_width + 5, y: ultimo_inicioY, font : Roboto_Ref, size: font_size });

                const cubiculo_texto = nombre;
                const cubiculo_label = '· Cubículo: ';
                ultimo_inicioY = ultimo_inicioY - altoLinea - 8;
                page.drawText(cubiculo_label, { x: margenLateral, y: ultimo_inicioY, font : RobotoBold_Ref, size: font_size });
                label_width = RobotoBold_Ref.widthOfTextAtSize(cubiculo_label, font_size);
                page.drawText(cubiculo_texto, { x: margenLateral + label_width + 5, y: ultimo_inicioY, font : Roboto_Ref, size: font_size });

                // Guardado del PDF
                const pdfBytes = await pdfDoc.save();

                const mailOptions = {
                    from: transporter.options.auth.user,
                    to: `${email}`,
                    subject: 'Confirmación de reserva',
                    html: `
<p>Se ha confirmado su reserva.</p>
<p>Los datos son los siguientes:<p>
<ul>
    <li><b>Cubículo:</b> ${nombre}</li>
    <li><b>Fecha:</b> ${fechaDeReserva_texto}</li>
    <li><b>Hora de entrada:</b> ${horaInicio_texto}</li>
    <li><b>Hora de salida:</b> ${horaFin_texto}</li>
</ul>
<img src='${url}'/>`,
                    attachments: [{
                        filename: 'Confirmación.pdf',
                        content: pdfBytes,
                        contentType: 'application/pdf',
                    }],
                };

                transporter.sendMail(mailOptions, function (error, info) {
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

// Código QR para una reserva
router.get("/qr", async (req, res) => {
    if (!estaAutenticado(req, false)) {
        return res.status(403).send("Acceso denegado");
    }
    const saved = req.session.user;


    if (!(req.query.id)) {
        return res.status(401).send("Formato incorrecto");
    }

    const request = new sqlcon.Request();
    request.input("IN_idReserva", sqlcon.Int, req.query.id);

    // Ejecutar la consulta
    request.execute("BiblioTEC_SP_ObtenerReserva", (error, resultado) => {
        if (error) {
            manejarError(res, error);
        } else {
            const salida = resultado.recordset[0];
            const stJson = JSON.stringify({
                idReserva: req.query.id,
                nombre: salida.nombreCubiculo,
                horaInicio: salida.horaInicio,
                estudiante: salida.idEstudiante,
            });

            if (
                saved.tipoUsuario === "Administrador" ||
                salida.idEstudiante === saved.idEstudiante
            ) {

                qr.toBuffer(stJson, async (err, texto) => {
                    if (error) {
                        console.error('Error generating QR code:', err);
                        return res.sendStatus(500);
                    }

                    res.setHeader('Content-Type', 'image/png');
                    res.setHeader('Content-Disposition', 'inline; filename="qr.png"');
                    
                    return res.send(texto);
                });
            } else {
                return res.status(403).send("Acceso denegado");
            }
        }
    });
});

module.exports = router;