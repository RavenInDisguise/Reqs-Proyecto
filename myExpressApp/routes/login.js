var express = require('express');
var router = express.Router();
const sqlcon = require('./database.js');
const bcrypt = require('bcrypt');
const manejarError = require('./errores.js');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index');
});

// Verificar si hay una sesión iniciada
router.get('/api/login', (req, res) => {
    const saved = req.session.user;

    if (saved) {
        res.send({
            loggedIn: true,
            userId: saved.userId,
            email: saved.email,
            idEstudiante: saved.idEstudiante,
            tipoUsuario: saved.tipoUsuario
        });
    } else {
        res.send({
            loggedIn: false
        });
    }
});

// Cierre de sesión
router.get('/api/logout', (req, res) => {
    const saved = req.session.user;

    if (saved) {
        req.session.user = null;
        res.send({
            message: "Ok"
        });
    } else {
        res.status(401).send({
            message: 'No hay ninguna sesión activa'
        });
    }
});
  
// Inicio de sesión
router.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const request = new sqlcon.Request();

    // Parámetros de entrada
    request.input('IN_email', sqlcon.VarChar, email);

    request.execute('BiblioTEC_SP_Login', (error, result) => {
        if (error) {
            manejarError(res, error);
        } else {
            if (result.recordset.length > 0) {
                bcrypt.compare(password, result.recordset[0].clave, (error, response) => {
                    if (error) {
                        console.log(error);
                        res.status(500).send({ message: 'Ocurrió un error inesperado '});
                    } else if (response) {
                        /* Coincide */
                        req.session.user = {
                            userId: result.recordset[0].UsuarioID,
                            email: result.recordset[0].correo,
                            idEstudiante: result.recordset[0].EstudianteID,
                            tipoUsuario: result.recordset[0].TipoUsuario
                        };
                        console.log(result.recordset[0].TipoUsuario)
                        res.send(req.session.user);
                    } else {
                        /* No coincide */
                        res.status(401).send({ message: 'No coincide el usuario o contraseña' });
                    }
                })
            } else {
                res.status(401).send({ message: "El usuario no existe" });
            }
        }
    });
});

module.exports = router;