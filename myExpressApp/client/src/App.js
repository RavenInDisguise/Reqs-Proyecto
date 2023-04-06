import React, { useState } from "react";
import axios from 'axios';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function submit(e) {
    e.preventDefault();

    await axios.post('http://localhost:3001/', { email, password })
      .then(res => {
        if (res.status == 200) {
          alert(`${res.data.message}.\n\nCorreo: ${res.data.correo}`);
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

  return (
    <div className="login">
      <h3>Iniciar sesión</h3>
      <form action="POST">
        <div className="form-group">
          <input className="form-control" type="email" placeholder="Correo electrónico" onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <input className="form-control" type="password" placeholder="Contraseña" onChange={e => setPassword(e.target.value)} />
        </div>
        <input class="btn btn-primary w-100" type="submit" value="Iniciar sesión" onClick={submit} />
      </form>

      <a><p>Registrarse</p></a>
    </div>
  );
}

export default App;
