import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './Tarjeta.css';

function Reservar() {

    axios.defaults.withCredentials = true;
    const navigate = useNavigate();
    const parametros = new URLSearchParams('?' + document.URL.split('/').at(-1).split('?').at(-1));
    const idCubiculo = parametros.get('id');
    const horaInicio = parametros.get('inicio');
    const [nombre, setNombre] = useState();
    const [capacidad, setCapacidad] = useState(0);
    const [servicios, setServicios] = useState([]);
    const [tiempoMaximo, setTiempoMaximo] = useState(0);
    const [IdEstudiante, setIdEstudiante] = useState(null)
    const [email, setEmail] = useState('')

    useEffect(() => {
        axios.get("http://localhost:3001/login").then((response) => {
            if(response.data.loggedIn && response.data.tipoUsuario == 'Estudiante'){
                setIdEstudiante(response.data.idEstudiante);
                setEmail(response.data.email);
            }else{
                navigate('/')
            }
        })

        if (!idCubiculo) {
            navigate(-1);
        } else {
            axios.get('http://localhost:3001/cubiculo?id=' + idCubiculo).then((response) => {
                try {
                    let info = response.data;
                    let newServicios = info[0].servicios;
                    for (let i = 0; i < newServicios.length; i++) {
                        newServicios[i].anterior = !(!(newServicios[i].activo))
                    }
                    setNombre(info[0].nombre);
                    setServicios(newServicios);
                    setCapacidad(info[0].capacidad);
                    setTiempoMaximo(info[0].minutosMaximo);
                } catch (error) {
                    console.log(error)
                    alert('Ocurrió un error al cargar la información');
                }
            })
        }
    }, [])

        function reservar(){
            const nuevaHora = new Date(horaInicio.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/, '$3-$2-$1T$4:$5'));
            nuevaHora.setMinutes(nuevaHora.getMinutes() + tiempoMaximo);
            const horaFin = nuevaHora.toISOString().replace("T", " ").replace("Z", "")
            axios.post('http://localhost:3001/Reservar/Cubiculo',{idCubiculo, IdEstudiante,horaInicio,horaFin,email, nombre}).then((response)=>{
                try{
                    alert(response.data.message)
                    navigate('/Menu')
                }
                catch{
                    alert('Hubo un error en la reserva')
                }
            })
        }



  return (
    <div className="tarjeta reserva">
        <h1>Reservar Cubículo</h1>
        <div className='Cubiculo-datos'>
            <div className="Dato">
                <label for='nombre-cubiculo'>Nombre:</label>
                <input id='nombre-cubiculo' value={nombre} disabled/>
            </div>
            <div className="Dato">
                <label for='capacidad-cubiculo'>Capacidad:</label>
                <input id='capacidad-cubiculo' value={capacidad} disabled/>
            </div>
            <div className="Dato">
                <label for='TiempoMax-cubiculo'>Tiempo Maximo:</label>
                <input id='TiempoMax-cubiculo' value={tiempoMaximo + ' minutos'} disabled/>
            </div>
            <div className="Dato">
                <ul>
                    {servicios.filter((servicio) => (servicio.activo)).map(servicio =>(<li>{servicio.nombre}</li>))}
                </ul>
            </div>
        </div>
        <button onClick={e=>{reservar()}}>Reservar</button>
    </div>
  )
}

export default Reservar