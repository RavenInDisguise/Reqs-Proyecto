import React, { useEffect, useState } from "react";
import './Registro.css'
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

  async function submit(e) {
    e.preventDefault();

    await axios.post('http://localhost:3001/estudiante/crear',
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
            alert(res.data.message)
          case 422:
            alert(res.data.message)
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
    <div className='Registro'>
      <h3>Registrarse</h3>
      <form action='post'>
        <div className='form-group' >
          <input type='text' required placeholder='Nombre' onChange={e => setNombre(e.target.value)}/>
        </div>
        <div className='form-group'>
          <input type='text'  placeholder='Apellido 1' required onChange={e => setApellido1(e.target.value)}/>
          <input type='text' placeholder='Apellido 2' required onChange={e=> setApellido2(e.target.value)}/>
        </div>
        <div className='form-group'>
          <input type='number' placeholder='Número de Cédula' required onChange={e=> setCedula(e.target.value)}/>
        </div>
        <div className='form-group' id='Nombre'>
          <input type='number' placeholder='Número de Carné' required onChange={e=> setCarnet(e.target.value)}/>
        </div>
        <div className='form-group' id='fechaNacimiento'>
          <p>Nacimiento</p>
          <input  type='date' placeholder='Nacimiento' required onChange={e=>setFechaDeNacimiento(e.target.value)}/>
        </div>
        <div className='form-group'>
          <input  type='email' placeholder='Correo institucional' required onChange={e=>setCorreo(e.target.value)}/>
        </div>
        <div className='form-group'>
          <input  type='password' placeholder='Contraseña institucional' required onChange={e=>setClave(e.target.value)}/>
        </div>
        <input className="btn btn-primary" type="submit" value="Registrarse" onClick={submit} />
      </form>
      <a href="/"><p>Iniciar Sesión</p></a>
    </div>
  )
}

export default Registro