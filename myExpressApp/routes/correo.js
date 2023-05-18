const nodemailer = require("nodemailer");
var qr = require('qrcode')

const mail = 'bibliotec.itcr@gmail.com'

//configuracion del correo 
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: mail,
      pass: 'xykvnpfvomvkgstf'
    }
  });

export default transporter