var sqlcon = require("mssql");

// Configuración de la base de datos
const config = {
    user: "BiblioAPI",
    password: "BAiPbIli!0",
    server: "appbibliotec.database.windows.net",
    database: "appbibliotec-database",
    options: {
        encrypt: true,
    },
};

// Automatización, para desactivar las reservas que no se hayan confirmado
let siguientesVerificaciones = [];
let siguienteVerificacion = null;

function hacerVerificacion(isoString) {
    console.log("→→→ -------------------------------------------------------");
    console.log("→→→   Desactivando reservas sin confirmar...");
    console.log("→→→");

    const request = new sqlcon.Request();

    // Se elimina la hora de la lista
    siguientesVerificaciones = siguientesVerificaciones
        .filter((hora) => hora != isoString)
        .sort();

    if (siguientesVerificaciones.length != 0) {
        siguienteVerificacion = new Date(siguientesVerificaciones[0]);
    } else {
        siguienteVerificacion = null;
    }

    setTimeout(function () {
        request.execute(
            "BiblioTEC_SP_DesactivarReservas",
            (error, resultado) => {
                if (error) {
                    console.log("→→→ Ocurrió un error:");
                    console.log(error);
                    console.log("\n");

                    let enUnMinuto = new Date(new Date().getTime() + 60000);

                    if (
                        siguienteVerificacion == null ||
                        siguienteVerificacion > enUnMinuto
                    ) {
                        siguienteVerificacion = enUnMinuto;
                        let enUnMinutoString = enUnMinuto.toISOString();
                        siguientesVerificaciones.push(enUnMinutoString);

                        console.log(
                            "→→→   Reintentando en un minuto (" +
                                enUnMinutoString() +
                                ")..."
                        );
                    } else {
                        console.log(
                            "→→→   Reintantando pronto (" +
                                siguienteVerificacion.siguienteVerificacion.toISOString() +
                                ")..."
                        );
                    }
                    console.log(
                        "→→→ -------------------------------------------------------"
                    );
                } else {
                    let salida = resultado.recordset[0];
                    console.log(
                        "→→→   Éxito (" + salida.horaActual.toISOString() + ")"
                    );
                    console.log(
                        "→→→     →  Reservas desactivadas: " +
                            salida.cancelaciones
                    );
                    agregarVerificacion(salida.siguienteHora);
                    console.log(
                        "→→→     →  Próxima verificación: " +
                            siguienteVerificacion.toISOString()
                    );
                    console.log(
                        "→→→ -------------------------------------------------------"
                    );
                }
            }
        );
    }, 2000);
}

function agregarVerificacion(fecha) {
    if (fecha) {
        const actual = new Date();

        // Las verificaciones se harán cada vez que empiece una reserva o cada
        // medianoche

        const siguienteMedianoche = new Date();
        siguienteMedianoche.setHours(24, 0, 0, 0);

        // Se elige el menor
        if (fecha > siguienteMedianoche) {
            fecha = siguienteMedianoche;
        }

        // Se revisa si ya está planeada una verificación a esa hora
        const newIsoString = fecha.toISOString();

        if (
            !siguientesVerificaciones.includes(newIsoString) &&
            (siguienteVerificacion == null || fecha < siguienteVerificacion)
        ) {
            siguientesVerificaciones.push(newIsoString);
            siguienteVerificacion = fecha;

            setTimeout(
                hacerVerificacion,
                fecha.getTime() - actual.getTime(),
                newIsoString
            );
        }
    } else {
        const siguienteMedianoche = new Date();
        siguienteMedianoche.setHours(24, 0, 0, 0);

        // Se revisa si ya está planeada una verificación a esa hora
        const newIsoString = siguienteMedianoche.toISOString();

        if (
            !siguientesVerificaciones.includes(newIsoString) &&
            (siguienteVerificacion == null ||
                siguienteMedianoche < siguienteVerificacion)
        ) {
            siguientesVerificaciones.push(newIsoString);
            siguienteVerificacion = siguienteMedianoche;

            setTimeout(
                hacerVerificacion,
                fecha.getTime() - actual.getTime(),
                newIsoString
            );
        }
    }
}

// Establecer conexión a la base de datos de Azure
sqlcon.connect(config, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("Conexión exitosa a la base de datos de Azure");
        hacerVerificacion(new Date());
    }
});

module.exports = { sqlcon, agregarVerificacion };
