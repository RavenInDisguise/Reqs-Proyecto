/* Código que se encarga de manejar los errores */

const manejarError = (res, error) => {
    const mensaje = error.message.split(' - Error Number: ');

    // Si error.number == 50000, es un error que se mandó con un RAISERROR
    //  en el CATCH del stored procedure
    // Luego se revisa si el código que viene al final del mensaje es 50000
    //  (sería un error personalizado, así que se envía tal cual como respuesta)

    if (error.number == 50000 && mensaje.at(-1) == '50000') {
        res.status(400).send({ message: mensaje[0] });
    } else {
        // Si no se cumplió alguna de las condiciones, es un error inesperado
        //  y no se muestra al usuario
        res.status(500).send({ message: 'Ocurrió un error inesperado' });
        console.log(error);
    }
}

module.exports = manejarError;