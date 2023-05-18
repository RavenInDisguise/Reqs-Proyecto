const estaAutenticado = (req, admin = false, idEstudiante = -1) => {
    const saved = req.session.user;
  
    if (saved && saved.userId && saved.tipoUsuario) {
      if (!admin || saved.tipoUsuario == 'Administrador' || saved.idEstudiante == idEstudiante) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
module.exports = estaAutenticado