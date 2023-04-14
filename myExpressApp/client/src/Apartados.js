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
    const [listaReservas,setListaReservas]=useState([]);
    const [IdEstudiante, setIdEstudiante] = useState(null);
    const [email, setEmail] = useState('')
    const [infoCargada, setInfoCargada] = useState(false);

    useEffect(() => {

        axios.get("/api/login").then((res) => {

            if(res.data.loggedIn && res.data.tipoUsuario == 'Estudiante'){
                setIdEstudiante(res.data.idEstudiante);
                setEmail(res.data.email);
                axios.get(`/api/estudiante/reservas?id=${res.data.idEstudiante}`).then((response) => {
                    try {
                        setListaReservas(response.data);
                        setInfoCargada(true);
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

    const eliminarReserva = (id) =>{
        if (window.confirm('¿Desea borrar la reserva actual?')) {
            axios.put('/api/reserva/eliminar?id=' + id).then((response) => {
            try {
                if (response.status == 200) {
                    alert('Reserva eliminada');
                    window.location.reload(true);
                } else {
                    alert('Ocurrió un ejecutar la operación');
                }
            } catch (error) {
                alert('Ocurrió un ejecutar la operación');
            }
            }).catch((error) => {
                alert('Ocurrió un ejecutar la operación');
            })
        }
    }

    const confirmarReserva = (id, nombre, horaInicio, horaFin)=>{
        axios.put(`/api/reserva/confirmar?id=${id}&nombre=${nombre}&horaInicio=${horaInicio}&horaFin=${horaFin}`).then((response) => {
            try {
                if (response.status == 200) {
                    alert('Reserva confirmada');
                    window.location.reload(true);
                } else {
                    alert('Ocurrió un ejecutar la operación');
                }
            } catch (error) {
                alert('Ocurrió un ejecutar la operación');
            }
            }).catch((error) => {
                alert('Ocurrió un ejecutar la operación');
        })
    }
    return (
        <div className="tarjeta Lista-Reservas">
            <h1>Lista de reservas</h1>
            {(infoCargada ?
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
                                <p><b>Estado:</b> {(e.confirmado?'Confirmado':(e.activo?'Sin confirmar':'Eliminada'))} <b>· Fecha reservada:</b> {formatoLocal(e.horaInicio, true, false)}, de {formatoLocal(e.horaInicio, false, true)} a {formatoLocal(e.horaFin, false, true)}</p>
                            </div>
                        </div>
                        <div className="opciones">
                            {e.activo?(<FontAwesomeIcon className="iconoOpcion" icon={faTrashCan} title="Eliminar reserva" onClick={()=>{
                                eliminarReserva(e.id);
                            }}/>):
                            <FontAwesomeIcon className="iconoOpcion desactivado" icon={faTrashCan} title="Eliminar reserva"/>}
                            {e.confirmado || !e.activo ?(<FontAwesomeIcon id={e.id} className="iconoOpcion desactivado" icon={faCheck} title="Confirmar reserva" />)
                                          :<FontAwesomeIcon id={e.id} className="iconoOpcion" icon={faCheck} title="Confirmar reserva" onClick={()=>{
                                            confirmarReserva(e.id,e.nombre,e.horaInicio,e.horaFin)
                                        }}/>}
                        </div>
                    </div>
                ))}
            </div> : <p>Cargando...</p>)}
        </div>
    )
}

export default Apartados