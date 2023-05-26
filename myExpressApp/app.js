const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const indexRouter = require('./routes/index.js');
const loginRouter = require('./routes/login.js');
const estudiantesRouter = require("./routes/estudiantes.js");
const cubiculosRouter = require("./routes/cubiculos.js")
const reservasRouter = require("./routes/reservas.js")

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(cors({
  origin: ["http://appbibliotec.azurewebsites.net", /http:\/\/appbibliotec.azurewebsites.net\/.+/],
  methods: ["GET", "POST", "PUT"],
  credentials: true
}));
app.use(bodyParser.urlencoded( { extended : true }));

app.use(session({
  key: "userId",
  secret: "NoAutorizamosQueNosHackeen",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 /* Un día (en milisegundos) */
  }
}))

app.use('/', indexRouter);
app.use('/api/', loginRouter);
app.use('/api/estudiante', estudiantesRouter)
app.use('/api/cubiculo', cubiculosRouter)
app.use('/api/reserva', reservasRouter)


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(200).sendFile(path.join(__dirname, 'client/build', 'index.html'))
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
