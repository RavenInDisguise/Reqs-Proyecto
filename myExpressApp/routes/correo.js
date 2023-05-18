const nodemailer = require("nodemailer");


const mail = 'bibliotec.itcr@gmail.com'

//configuracion del correo 
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: mail,
      pass: 'xykvnpfvomvkgstf'
    }
  });

module.exports = transporter