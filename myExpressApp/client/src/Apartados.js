import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './Apartados.css';
import './Tarjeta.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashCan,faCheck } from '@fortawesome/free-solid-svg-icons'

const idiomaLocal = ['es-CR', 'es'];
const formatoFecha = { month: 'long', day: 'numeric'};
const formatoHora = {hour12: true, hour: 'numeric', minute: 'numeric'};

function Apartados() {

    const navigate = useNavigate();
    const [listaReservas,setListaReservas]=useState([])
    const [IdEstudiante, setIdEstudiante] = useState(null)
    const [email, setEmail] = useState('')

    useEffect(() => {

        axios.get("http://localhost:3001/login").then((res) => {

            if(res.data.loggedIn && res.data.tipoUsuario == 'Estudiante'){
                setIdEstudiante(res.data.idEstudiante);
                setEmail(res.data.email);
                axios.get(`/estudiante/reservas?id=${res.data.idEstudiante}`).then((response) => {
                    try {
                        setListaReservas(response.data);
                    } catch (error) {
                        alert('Ocurrió un error al cargar la información');
                    }
                })
            }else{
                navigate('/')
            }
        })
        
    },
    []);

    const formatoLocal = (stringIso, fecha=true, hora=true) => {
        let respuesta = [];
        try {
            const objetoDate = new Date(stringIso);
            if (fecha) {
                respuesta.push(objetoDate.toLocaleDateString(idiomaLocal, formatoFecha));
            }
            if (hora) {
                respuesta.push(objetoDate.toLocaleTimeString(idiomaLocal, formatoHora));
            }
            return respuesta.join(', ');
        } catch (error) {
            return '';
        }
    }

    return (
        <div className="tarjeta Lista-Reservas">
            <h1>Lista de Reservas</h1>
            <div className="lista">
                {listaReservas.map((e)=>(
                    <div className="reserva-lista">
                        <div className="datos">
                            <p>
                                <span className="nombre">Cubículo: {e.nombre}</span>
                                <b> · Capacidad: {e.capacidad}</b>
                                <b> · Fecha:</b> {formatoLocal(e.fecha)}
                                <b></b>
                                <b></b>
                            </p>
                            <div className="otros-datos">
                                <p><b>Estado:{(e.confirmado?'Confirmado':'Sin Confirmar')}</b><b>· Fecha reservada:</b> {formatoLocal(e.horaInicio, true, false)}, de {formatoLocal(e.horaInicio, false, true)} a {formatoLocal(e.horaFin, false, true)}</p>
                            </div>
                        </div>
                        <div className="opciones">
                            <FontAwesomeIcon className="iconoOpcion desactivado" icon={faTrashCan} title="Eliminar reserva" />
                            {e.confirmado?(<FontAwesomeIcon className="iconoOpcion desactivado" icon={faCheck} title="Confirmar reserva" />)
                                          :<FontAwesomeIcon className="iconoOpcion" icon={faCheck} title="Confirmar reserva" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Apartados