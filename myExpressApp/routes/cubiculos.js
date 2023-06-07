var express = require('express');
const { sqlcon, agregarVerificacion } = require('./database.js');
var router = express.Router();
let estaAutenticado = require('./autenticado.js');
const manejarError = require('./errores.js');
let transporter = require('./correo.js');

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

// Retorna la lista de todos los cubículos, con estos datos:
// ID, nombre, estado, capacidad, servicios y tiempo máximo
// (Puede limitarse solo al ID y al nombre)
router.get('/cubiculos', (req, res) => {
    if (!estaAutenticado(req, true)) {
        return res.status(403).send('Acceso denegado');
    }

    const soloNombre = req.query.soloNombre;
    const request = new sqlcon.Request();

    // Parámetros de entrada
    request.input('IN_soloNombre', sqlcon.Bit, soloNombre);

    request.execute('BiblioTEC_SP_ObtenerCubiculos', (error, resultado) => {
        if (error) {
            manejarError(res, error);
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
                        const { id, nombre, capacidad, minutosMaximo, estado } = cubiculo;

                        cubiculos[idCubiculo] = {
                            id,
                            nombre,
                            capacidad,
                            minutosMaximo,
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
        }
    });
});
  
// Ruta para los posibles estados de los cubículos
router.get('/estados', (req, res) => {
    if (!estaAutenticado(req, true)) {
        return res.status(403).send('Acceso denegado');
    }

    const request = new sqlcon.Request();
    request.execute('BiblioTEC_SP_ObtenerEstados', (error, resultado) => {
        if (error) {
            manejarError(req, error);
        } else {
            res.send({ estados: resultado.recordset.map((r) => r.descripcion) });
        }
    });
});
  
// Ruta para los posibles servicios de los cubículos
router.get('/servicios', (req, res) => {
    if (!estaAutenticado(req, false)) {
        return res.status(403).send('Acceso denegado');
    }

    const request = new sqlcon.Request();
    request.execute('BiblioTEC_SP_ObtenerServicios', (error, resultado) => {
        if (error) {
            manejarError(req, error);
        } else {
            res.send({servicios: resultado.recordset.map((r) => r.descripcion)});
        }
    });
});

// Ruta que retorna los datos de un solo cubículo:
// ID, nombre, estado, servicios, tiempo máximo de uso y número de reservas activas
router.get('/', (req, res) => {
    if (!estaAutenticado(req, false)) {
      return res.status(403).send('Acceso denegado');
    }

    const idCubiculo = req.query.id;
    const request = new sqlcon.Request();

    // Parámetros de entrada
    request.input('IN_idCubiculo', sqlcon.Int, idCubiculo);
    
    request.execute('BiblioTEC_SP_ObtenerCubiculo', (error, resultado) => {
        if (error) {
            manejarError(res, error);
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
        }
    });
  });

// Ruta de cubículos disponibles 
// Retorna los cubículos disponibles, cada uno con sus datos:
// nombre, estado, capacidad, servicios, tiempo máximo de uso
router.get('/disponibles', (req, res) => {
    if (!estaAutenticado(req, false)) {
        return res.status(403).send('Acceso denegado');
    }

    const horaInicio = req.query.horaInicio;
    const horaFin = req.query.horaFin;

    const request = new sqlcon.Request();

    // Parámetros de entrada
    request.input('IN_horaInicio', sqlcon.VarChar, horaInicio);
    request.input('IN_horaFin', sqlcon.VarChar, horaFin);

    request.execute('BiblioTEC_SP_ObtenerCubiculosDisponibles', (error, resultado) => {
        if (error) {
            manejarError(res, error);
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
                    const { id, nombre, estado, capacidad, minutosMaximo, servicio } = cubiculo;

                    cubiculos[idCubiculo] = {
                        id,
                        nombre,
                        estado,
                        capacidad,
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
        }
    });
});

  //eliminar cubiculo 
router.put("/eliminar", (req, res) => {
    if (!estaAutenticado(req, true)) {
        return res.status(403).send('Acceso denegado');
    }

    const idCubiculo = req.query.id;
    const request = new sqlcon.Request();

    // Parámetros de entrada
    request.input('IN_idCubiculo', sqlcon.Int, idCubiculo);

    request.execute('BiblioTEC_SP_EliminarCubiculo', (error, resultado) => {
        if (error) {
            manejarError(res, error);
        } else {
            const salidaCorreos = resultado.recordset.map((s) => s.correo);
            if (salidaCorreos.length > 0) {
                const textoCorreo = `Hola:
  
Se han hecho cambios en un cubículo, lo cual ocasionó que se cancelara su reserva.
  
Puede hacer otra reserva a través de la plataforma.`;

                const mailOptions = {
                    from: transporter.options.auth.user,
                    bcc: salidaCorreos,
                    subject: 'Actualización de cubículo',
                    text: textoCorreo
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Correo enviado: ' + info.response);
                    }
                });
            }
            res.status(200).send({});
        }
    });
});
  
// Actualizar un cubículo
router.put("/", (req, res) => {
    if (!estaAutenticado(req, true)) {
        return res.status(403).send('Acceso denegado');
    }

    const cuerpo = req.body;

    const idCubiculo = cuerpo.idCubiculo;
    const servicios = cuerpo.servicios;
    const capacidad = cuerpo.capacidad;
    const nombre = cuerpo.nombre;
    const estado = cuerpo.estado;
    const cancelarReservas = cuerpo.cancelarReservas;
    const minutosMaximo = cuerpo.minutosMaximo;
    const notificarUsuarios = cuerpo.notificarUsuarios;

    if (!cuerpo || !idCubiculo || !servicios || !capacidad || !nombre || !estado
        || minutosMaximo == null || minutosMaximo == undefined || !(minutosMaximo == parseInt(minutosMaximo).toString())
        || !(capacidad == parseInt(capacidad).toString()) || !(idCubiculo == parseInt(idCubiculo).toString()) || cancelarReservas == null
        || cancelarReservas == undefined || notificarUsuarios == undefined) {
        res.status(401).send({ message: 'Los datos ingresados son incorrectos' });
    }

    const tabla_de_servicios = new sqlcon.Table('TVP_Servicios');

    // Se construye el TVP
    tabla_de_servicios.columns.add('descripcion', sqlcon.VarChar);
    tabla_de_servicios.columns.add('activo', sqlcon.Bit);

    for (let s_i = 0; s_i < servicios.length; s_i++) {
        tabla_de_servicios.rows.add(servicios[s_i].nombre, servicios[s_i].activo)
    }

    const request = new sqlcon.Request();

    // Parámetros de entrada
    request.input('IN_idCubiculo', sqlcon.Int, idCubiculo);
    request.input('IN_nombreNuevo', sqlcon.VarChar, nombre);
    request.input('IN_capacidad', sqlcon.Int, capacidad);
    request.input('IN_estadoNuevo', sqlcon.VarChar, estado);
    request.input('IN_cancelarReservas', sqlcon.Bit, cancelarReservas);
    request.input('IN_minutosMaximo', sqlcon.Int, minutosMaximo);
    request.input('IN_servicios', tabla_de_servicios);

    request.execute('BiblioTEC_SP_ActualizarCubiculo', (error, resultado) => {
        if (error) {
            manejarError(res, error);
        } else {
            const salidaCorreos = resultado.recordset.map((s) => s.correo);
            if (notificarUsuarios) {
                let textoCorreo = '';
                if (cancelarReservas) {
                    textoCorreo = `Hola:

Se han hecho cambios en el cubículo ${nombre}, lo cual ocasionó que se cancelara su reserva.

Puede hacer otra reserva a través de la plataforma.`;
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

Su reserva sigue activa. Puede hacer cambios a sus reservas ingresando a la plataforma.`;
                }

                const mailOptions = {
                    from: transporter.options.auth.user,
                    bcc: salidaCorreos,
                    subject: 'Actualización de cubículo',
                    text: textoCorreo
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Correo enviado: ' + info.response);
                    }
                });
            }
            res.status(200).send({});
        }
    });
})

router.post('/reservar', (req, res) => {
    if (!estaAutenticado(req, false)) {
        return res.status(403).send('Acceso denegado');
    }

    const { idCubiculo, idEstudiante, horaInicio, horaFin, email, nombre } = req.body;

    let horaInicio_obj, horaFin_obj;

    try {
        horaInicio_obj = new Date(horaInicio.replace(" ", "T") + "Z");
        horaFin_obj = new Date(horaFin.replace(" ", "T") + "Z");
    } catch (error) {
        return res.status(401).send({ message : 'Datos erróneos' });
    }
    
    const fechaDeReserva_texto = new Intl.DateTimeFormat(idiomaLocal, formatoFecha).format(horaInicio_obj);
    const horaInicio_texto = new Intl.DateTimeFormat(idiomaLocal, formatoHora).format(horaInicio_obj).replace(/(00)(:\d{2})/, '12$2');
    const horaFin_texto = new Intl.DateTimeFormat(idiomaLocal, formatoHora).format(horaFin_obj).replace(/(00)(:\d{2})/, '12$2');

    const request = new sqlcon.Request();

    // Parámetros de entrada
    request.input('IN_idCubiculo', sqlcon.Int, idCubiculo);
    request.input('IN_idEstudiante', sqlcon.Int, idEstudiante);
    request.input('IN_horaInicio', sqlcon.VarChar, horaInicio);
    request.input('IN_horaFin', sqlcon.VarChar, horaFin);

    request.execute('BiblioTEC_SP_HacerReserva', (error, resultado) => {
        if (error) {
            manejarError(res, error);
        } else {
            res.send({ message: 'Reserva registrada existosamente' })

            try {
                // Se agrega a la cola de las verificaciones que se hacen para
                // desactivar las reservas que no se confirmen
                agregarVerificacion(horaInicio_obj);
            } catch (error) {
                console.dir(error);
            }

            const mailOptions = {
                from: transporter.options.auth.user,
                to: `${email}`,
                subject: 'Reserva de cubículo',
                html: `
<p>Se ha efectuado su reserva.</p>
<p>Los datos son los siguientes:<p>
<ul>
    <li><b>Cubículo:</b> ${nombre}</li>
    <li><b>Fecha:</b> ${fechaDeReserva_texto}</li>
    <li><b>Hora de entrada:</b> ${horaInicio_texto}</li>
    <li><b>Hora de salida:</b> ${horaFin_texto}</li>
</ul>
<p>Para solicitar el QR de la reserva, debe confirmarla desde la plataforma.</p>`
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Correo enviado: ' + info.response);
                }
            });
        }
    })
})
  
// Crear cubículo
router.put('/crear', (req, res) => {
    if (!estaAutenticado(req, true)) {
        return res.status(403).send('Acceso denegado');
    }

    const bod = req.body;
    const estado = bod.estadoActual;
    const nombre = bod.nombre;
    const servicios = bod.servicios;
    let capacidad = bod.capacidad;
    let minutosMax = bod.tiempoMaximo;
    
    // Convierte a entero la capacidad y el tiempo
    capacidad = parseInt(capacidad);
    minutosMax = parseInt(minutosMax);

    const tabla_de_servicios = new sqlcon.Table('TVP_Servicios');

    // Se construye el TVP
    tabla_de_servicios.columns.add('descripcion', sqlcon.VarChar);
    tabla_de_servicios.columns.add('activo', sqlcon.Bit);

    for (let s_i = 0; s_i < servicios.length; s_i++) {
        tabla_de_servicios.rows.add(servicios[s_i], true)
    }

    const request = new sqlcon.Request();

    // Parámetros de entrada
    request.input('IN_nombreNuevo', sqlcon.VarChar, nombre);
    request.input('IN_capacidad', sqlcon.Int, capacidad);
    request.input('IN_estadoNuevo', sqlcon.VarChar, estado);
    request.input('IN_minutosMaximo', sqlcon.Int, minutosMax);
    request.input('IN_servicios', tabla_de_servicios);

    request.execute('BiblioTEC_SP_CrearCubiculo', (error, resultado) => {
        if (error) {
            manejarError(res, error);
        } else {
            res.status(200).send();
        }
    });
}); 

module.exports = router;