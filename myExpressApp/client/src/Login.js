import React, { useEffect, useState } from "react";
import axios from 'axios';
import './Login.css';
import './Tarjeta.css';
import EstudianteMenu from "./EstudianteMenu";

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logueado, setLogueado] = useState(false);
  const [IdEstudiante, setIdEstudiante] = useState('')
  axios.defaults.withCredentials = true;

  async function submit(e) {
    e.preventDefault();

  await axios.post('http://localhost:3001/login', { email, password })
     .then(res => {
       if (res.status === 200) {
         window.location.reload(true);
       }
     }).catch(function (error) {
       try {
         alert('Ocurrió un error: ' + error.response.data.message);
       }
       catch {
         alert('Ocurrió un error.');
       }
     })
  }

  useEffect(() => {
    axios.get("http://localhost:3001/login").then((response) => {
      if (response.data.loggedIn) {
        setLogueado(true);
        setIdEstudiante(response.data.idEstudiante);
      } else {
        setLogueado(false);
      }
    })
  }, [])

  async function submit(e) {
    e.preventDefault();

    await axios.post('http://localhost:3001/login', { email, password })
      .then(res => {
        if (res.status === 200) {
          window.location.reload(true);
        }
      }).catch(function (error) {
        try {
          alert('Ocurrió un error: ' + error.response.data.message);
        }
        catch {
          alert('Ocurrió un error.');
        }
      })
  }
  if(!logueado){
    return (
      <div className="login tarjeta">
        <h1>Iniciar sesión</h1>
        <form action="POST">
          <div className="form-group">
            <input className="form-control" type="email" placeholder="Correo electrónico" onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <input className="form-control" type="password" placeholder="Contraseña" onChange={e => setPassword(e.target.value)} />
          </div>
          <input className="btn btn-primary" type="submit" value="Iniciar sesión" onClick={submit} />
        </form>
        <a href="/registrarse">Registrarse</a>
      </div>
    )
  }else{
    return <EstudianteMenu Id={IdEstudiante}/>
  }
}

export default Login;
