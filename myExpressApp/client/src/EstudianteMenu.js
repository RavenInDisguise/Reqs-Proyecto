import React, { useEffect, useState } from "react";
import axios from 'axios';

export default function EstudianteMenu(props) {
    const [Nombre, setNombre] = useState('')
    const [Carnet, setCarnet] = useState('')

    useEffect(() => {
        axios.get(`http://localhost:3001/estudiante?id=${props.Id}`).then((response) => {
          setNombre(`${response.data[0].nombre} ${response.data[0].apellido1} ${response.data[0].apellido2}`)
          setCarnet(response.data[0].carnet)
        })
    }, [])
  return (
        <div className='Menu-Estudiante'>
            <h3>{Nombre}</h3>
            <h3>{Carnet}</h3>
            <div className='container'>
                <h3>Reservar cubículos</h3>
                <ul>
                    <li>
                        <a>Ver cubículos disponibles</a>
                    </li>
                    <li>
                        <a>Ver lista de cubículos apartados</a>
                    </li>
                </ul>
            </div>
        </div>
  )
}
