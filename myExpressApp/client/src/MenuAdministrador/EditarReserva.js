import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './EditarReserva.css';
import '../Tarjeta.css';

const idiomaLocal = ['es-CR', 'es'];
const formatoFecha = { month: 'long', day: 'numeric'};
const formatoHora = {hour12: true, hour: 'numeric', minute: 'numeric', second: 'numeric'};

const horaActual = new Date();
const fechaActualString = (horaActual.getFullYear().toString() + "-" + ("0" + (horaActual.getMonth() + 1).toString()).slice(-2) + "-" + ("0" + horaActual.getDate().toString()).slice(-2));

const opciones = [
    { label: 'Confirmada', activo: true, confirmado: true },
    { label: 'Activa', activo: true, confirmado: false },
    { label: 'Inactiva', activo: false, confirmado: false }
]

export default () => {
    const navigate = useNavigate();
    const parametros = new URLSearchParams('?' + document.URL.split('/').at(-1).split('?').at(-1));
    const idReserva = parametros.get('id');

    const [infoReserva, setInfoReserva] = useState(null);
    const [cubiculos, setCubiculos] = useState(null);
    const [estudiantes, setEstudiantes] = useState(null);
    
    const [fecha, setFecha] = useState(null);
    const [horaInicio, setHoraInicio] = useState(null);
    const [horaFin, setHoraFin] = useState(null);
    
    const [estado, setEstado] = useState(null);
    const [cubiculo, setCubiculo] = useState(null);
    const [estudiante, setEstudiante] = useState(null);

    useEffect(() => {
        if (!idReserva) {
            navigate(-1);
        } else {
            axios.get('/reserva?idReserva=' + idReserva).then((response) => {
                try {
                    const horaInicioInicial = new Date(response.data[0].horaInicio);
                    const horaFinInicial = new Date(response.data[0].horaFin);
                    setFecha(horaInicioInicial.getFullYear().toString() + "-" + ("0" + (horaInicioInicial.getMonth() + 1).toString()).slice(-2) + "-" + ("0" + horaInicioInicial.getDate().toString()).slice(-2));
                    setHoraInicio(("0" + horaInicioInicial.getHours().toString()).slice(-2) + ":" + ("0" + horaInicioInicial.getMinutes().toString()).slice(-2));
                    setHoraFin(("0" + horaFinInicial.getHours().toString()).slice(-2) + ":" + ("0" + horaFinInicial.getMinutes().toString()).slice(-2));
                    setCubiculo(response.data[0].idCubiculo);
                    setEstudiante(response.data[0].idEstudiante);
                    setEstado((response.data[0].confirmado ? 0 : (response.data[0].activo ? 1 : 2)));
                    setInfoReserva(response.data[0]);
                } catch (error) {
                    console.log(error)
                    alert('Ocurrió un error al cargar la información');
                }
            })
            axios.get('http://localhost:3001/cubiculos?soloNombre=1').then((response) => {
                try {
                    setCubiculos(response.data)
                } catch (error) {
                    console.log(error)
                    alert('Ocurrió un error al cargar la información');
                }
            })
            axios.get('http://localhost:3001/estudiantes?soloNombre=1').then((response) => {
                try {
                    setEstudiantes(response.data)
                } catch (error) {
                    console.log(error)
                    alert('Ocurrió un error al cargar la información');
                }
            })
        }
    }, [])

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (estado == 2) {
            alert('Para modificar la reserva, debe reactivarla (seleccionando el estado de la lista provista)');
        } else {
            const horaInicioString = (new Date(fecha + ' ' + horaInicio)).toISOString().replace("T", " ").split(".")[0];
            const horaFinString = (new Date(fecha + ' ' + horaFin)).toISOString().replace("T", " ").split(".")[0];
            axios.put('/reserva', {
                id : idReserva,
                idCubiculo : cubiculo,
                idEstudiante : estudiante,
                horaInicio : horaInicioString,
                horaFin : horaFinString,
                activo : opciones[estado].activo,
                confirmado : opciones[estado].confirmado
            }).then(res => {
                switch (res.status){
                case 200:
                    alert('Cambio existoso');
                    window.location.reload();
                    break;
                default:
                    alert('Ocurrió un error');
                    break;
                }
            }).catch(function (error) {
                try {
                alert('Ocurrieron uno o más errores al intentar aplicar los cambios:\n\n- ' + error.response.data.errores.join('\n- '));
                }
                catch {
                alert('Ocurrió un error.');
                }
            });
        }
    }

    return (
        <div class="tarjeta reserva-editar">
        <h3>Modificar reserva</h3>
        {(infoReserva && cubiculos && estudiantes) ? (
                <form action="" onSubmit={(e) => handleSubmit(e)}>
                    <div className="form-group">
                        <p>Reserva hecha el {formatoLocal(infoReserva.fecha).replace(", ", " a las ")}</p>
                    </div>
                    <div className="form-group">
                        <label for="idNumber">ID</label>
                        <input className="form-control" id="idNumber" type='number' title='No es posible cambiar el ID de la reserva' disabled value={infoReserva.id}/>
                    </div>
                    <div className="form-group">
                        <label for="cubiculoSelect">Cubículo</label>
                        <select className="form-control" id="cubiculoSelect" required value={cubiculo} onChange={(e) => setCubiculo(e.target.value)}>
                            {(cubiculos.filter(c => c.id == infoReserva.idCubiculo).length == 0 ? <option value={infoReserva.idCubiculo} disabled>{infoReserva.idCubiculo.toString() + " - " + infoReserva.nombreCubiculo}</option> : <></>)}
                            {cubiculos.map((c) => <option value={c.id}>{c.id.toString() + " - " + c.nombre}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label for="estudianteSelect">Estudiante</label>
                        <select className="form-control" id="estudianteSelect" required value={estudiante} onChange={(e) => setEstudiante(e.target.value)}>
                            {(estudiantes.filter(e => e.id == infoReserva.idEstudiante).length == 0 ? <option value={infoReserva.idEstudiante} disabled>{infoReserva.idEstudiante.toString() + " - " + infoReserva.nombreEstudiante}</option> : <></>)}
                            {estudiantes.map((e) => <option value={e.id}>{e.id.toString() + " - " + e.Nombre}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label for='fecha'>Fecha</label>
                        <input className="form-control" type="date" id="fecha" value={fecha} min={fechaActualString} onChange={e=>{setFecha(e.target.value)}}/>
                    </div>
                    <div className="form-group">
                        <label for="inicio">Hora de entrada</label>
                        <input className="form-control" type="time" id="inicio" name="inicio" value={horaInicio} onChange={e=>{setHoraInicio(e.target.value)}}/>
                    </div>
                    <div className="form-group">
                        <label for="fin">Hora de salida</label>
                        <input className="form-control" type="time" id="fin" name="fin" value={horaFin} onChange={e=>{setHoraFin(e.target.value)}}/>
                    </div>  
                    <div className="form-group">
                        <label for="estado">Estado</label>
                        <select id="estado" value={estado} onChange={(e) => setEstado(e.target.value)} required>
                            {(estado == 2 ? <option value="2" disabled hidden selected>{opciones[2].label}</option> : <></>)}
                            {opciones.slice(0, 2).map((o, i) => <option value={i}>{o.label}</option>)}
                        </select>
                    </div>
                    <input className="btn btn-primary" type="submit" value="Guardar" />
                </form>
        )
        : <p>Cargando...</p>}
        {(infoReserva && cubiculos && estudiantes) ? <a href="javascript:void(0);" onClick={(e) => {navigate(-1)}}>Cancelar</a> : <></>}
        </div>
    )
}