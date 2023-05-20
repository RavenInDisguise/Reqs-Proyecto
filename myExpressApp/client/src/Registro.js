import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './Registro.css'
import './Tarjeta.css'
import axios from 'axios';

function Registro() {
  const [nombre, setNombre] = useState('')
  const [apellido1, setApellido1] = useState('')
  const [apellido2, setApellido2] = useState('')
  const [cedula, setCedula] = useState('')
  const [carnet, setCarnet] = useState('')
  const [fechaDeNacimiento, setFechaDeNacimiento] = useState(null)
  const [correo,setCorreo] = useState('')
  const [clave,setClave] = useState('')
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();

    await axios.post('estudiante/crear',
    {
      nombre,
      apellido1,
      apellido2,
      cedula,
      carnet,
      fechaDeNacimiento,
      correo,
      clave
    })
      .then(res => {
        switch (res.status){
          case 200:
            alert(res.data.message);
            navigate('/');
            break;
          case 422:
            alert(res.data.message);
            break;
          default:
            break;
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
    <div className='tarjeta Registro'>
      <h3>Registrarse</h3>
      <form onSubmit={(e) => submit(e)}>
        <div className='form-group' >
          <input className="form-control" type='text' required placeholder='Nombre' onChange={e => setNombre(e.target.value)}/>
        </div>
        <div className='form-group'>
          <input className="form-control" type='text'  placeholder='Primer apellido' required onChange={e => setApellido1(e.target.value)}/>
          <input className="form-control" type='text' placeholder='Segundo apellido' required onChange={e=> setApellido2(e.target.value)}/>
        </div>
        <div className='form-group'>
          <input className="form-control" type='number' placeholder='Número de cédula' required onChange={e=> setCedula(e.target.value)}/>
        </div>
        <div className='form-group' id='Nombre'>
          <input className="form-control" type='number' placeholder='Número de carné' required onChange={e=> setCarnet(e.target.value)}/>
        </div>
        <div className='form-group' id='fechaNacimiento'>
          <label>Fecha de nacimiento</label>
          <input className="form-control" id="dateOfBirthInput" type='date' placeholder='Nacimiento' required onChange={e=>setFechaDeNacimiento(e.target.value)}/>
        </div>
        <div className='form-group'>
          <input className="form-control" type='email' pattern=".+@estudiantec\.cr" placeholder='Correo institucional' required onChange={e=>setCorreo(e.target.value)}/>
        </div>
        <div className='form-group'>
          <input className="form-control" type='password' placeholder='Contraseña institucional' required onChange={e=>setClave(e.target.value)}/>
        </div>
        <input className="btn btn-primary" type="submit" value="Registrarse" />
      </form>
      <a href="/">Iniciar sesión</a>
    </div>
  )
}

export default Registro