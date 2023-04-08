import React, { useContext, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate} from "react-router-dom";
import axios from 'axios';
import './Login.css';
import { LoginContext, IdEstContext } from "./App";
import './Tarjeta.css';
import EstudianteMenu from "./EstudianteMenu";

function Login() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useContext(LoginContext)
  const [IdEstudiante, setIdEstudiante] = useContext(IdEstContext)
  axios.defaults.withCredentials = true;
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:3001/login").then((response) => {
      if (response.data.loggedIn) {
        setLoggedIn(true);
        navigate('/Menu')
      }
    })
  }, [])

  async function submit(e) {
    e.preventDefault();

     await axios.post('http://localhost:3001/login', { email, password })
     .then(res => {
       if (res.status == 200) {
        navigate('/Menu')
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
  if(loggedIn){
    return <Navigate to='/Menu' />
  }else{
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
        <a href="/registro">Registrarse</a>
      </div>
    )
  }
  
}

export default Login;
