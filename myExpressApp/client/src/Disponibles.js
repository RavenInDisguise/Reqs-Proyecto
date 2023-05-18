import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './Disponibles.css';
import './Tarjeta.css';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus } from "@fortawesome/free-solid-svg-icons";

let ultimoTimestamp = null;
const horaActual = new Date();
let horaFinInicial = new Date();
const horaActualString = ("0" + horaActual.getHours().toString()).slice(-2) + ":" + ("0" + horaActual.getMinutes().toString()).slice(-2);
const fechaActualString = (horaActual.getFullYear().toString() + "-" + ("0" + (horaActual.getMonth() + 1).toString()).slice(-2) + "-" + ("0" + horaActual.getDate().toString()).slice(-2));
horaFinInicial.setHours(horaFinInicial.getHours() + 1);
const delayEntrada = 2000; // Milisegundos

function Disponibles() {
    const navigate = useNavigate();
    axios.defaults.withCredentials = true;
    const [listaCubiculos, setListaCubiculos] = useState([]);
    const [listaFiltrada, setListaFiltrada] = useState([]);
    const [fecha, setFecha] = useState(fechaActualString);
    const [horaInicio, setHoraInicio] = useState(horaActualString);
    const [horaFin, setHoraFin] = useState(("0" + horaFinInicial.getHours().toString()).slice(-2) + ":" + ("0" + horaFinInicial.getMinutes().toString()).slice(-2));
    const [servicios, setServicios] = useState([]);
    const [serviciosFiltro, setServiciosFiltro] = useState([]);
    const [totalElementos, setTotalElementos] = useState(null);
    const [capacidad, setCapacidad] = useState(1);
    const [minutosSeleccionados, setMinutosSeleccionados] = useState(60);

    function getData(){
        const fechaInicio = (new Date(fecha + ' ' + horaInicio)).toISOString().replace("T", " ").split(".")[0];
        const fechaFinal = (new Date(fecha + ' ' + horaFin)).toISOString().replace("T", " ").split(".")[0]
        axios.get(`cubiculo/cubiculos/disponibles?horaInicio=${fechaInicio}&horaFin=${fechaFinal}`,).then((response) => {
            try {
                setListaCubiculos(response.data);
            } catch (error) {
                alert('Ocurrió un error al cargar la información');
            }
        });
    }  

    useEffect(() => {
        axios.get("/api/login").then((response) => {
            if(!(response.data.loggedIn && response.data.tipoUsuario == 'Estudiante')){
                navigate('/')
            }
        })

        axios.get('/cubiculo/servicios').then((response) => {
            try {
                setServicios(response.data.servicios.map((e) => ({label : e, value: e})))
            } catch (error) {
                console.log(error)
                alert('Ocurrió un error al cargar la información');
            }
        });
    }, []);

    useEffect(() => {
        /* Esto espera cierto tiempo después de que se hace un cambio en la hora
        o la fecha antes de volver a cargar la información */
        const actual = new Date();
        ultimoTimestamp = actual.getTime();
        setTimeout((a=actual.getTime()) => {
            if (ultimoTimestamp == a) {
                setListaCubiculos([]);
                getData();
            }
        }, delayEntrada)
    }, [horaInicio, horaFin, fecha]);

    useEffect(() => {
        filtrarLista();
    }, [serviciosFiltro, listaCubiculos, capacidad]);

    useEffect(() => {
        let inicio = new Date(fecha + " " + horaInicio);
        let fin  = new Date(fecha + " " + horaFin);
        setMinutosSeleccionados((fin - inicio) / (1000 /* milisegundos */ * 60 /* segundos por minuto */));
    }, [horaInicio, horaFin]);

    const filtrarLista = () => {
        let newListaFiltrada = listaCubiculos;
        if (serviciosFiltro.length > 0) {
            for (let serv = 0; serv < serviciosFiltro.length; serv++) {
                const element = serviciosFiltro[serv];
                newListaFiltrada = newListaFiltrada.filter((c) => ((c.capacidad >= capacidad) && (c.servicios.indexOf(element.value) != -1)));
            }
        } else {
            newListaFiltrada = newListaFiltrada.filter((c) => (c.capacidad >= capacidad));
        }
        setListaFiltrada(newListaFiltrada);
        setTotalElementos(newListaFiltrada.length);
    };

  return (
    <div className="tarjeta Lista-Cubiculos disponible">
        <h1>Reservar un cubículo</h1>
        {((listaCubiculos.join('')!='' && servicios.join('')!='') || ultimoTimestamp) ? (<div className="filtros">
            <div className="filtro">
                <label for='serviciosFiltro'>Servicios</label>
                <Select placeholder="Filtrar por servicios..." noOptionsMessage={() => 'No hay más opciones disponibles'} options={servicios} isMulti onChange={(e) => {setServiciosFiltro(e);}} closeMenuOnSelect={false} />
            </div>
            <div className="filtro">
                <label for='capacidad'>Capacidad mínima</label>
                <input className="form-control" type="number" id="capacidad" value={capacidad} min={1} step={1} onChange={e=>{setCapacidad(e.target.value)}}/>
            </div>
            <div className="filtro">
                <label for='fecha'>Fecha</label>
                <input className="form-control" type="date" id="fecha" value={fecha} min={fechaActualString} onChange={e=>{setFecha(e.target.value)}}/>
            </div>
            <div className="filtro">
                <label for="inicio">Hora de entrada</label>
                <input className="form-control" type="time" id="inicio" name="inicio" value={horaInicio} onChange={e=>{setHoraInicio(e.target.value)}}/>
            </div>
            <div className="filtro">
                <label for="fin">Hora de salida</label>
                <input className="form-control" type="time" id="fin" name="fin" value={horaFin} min={horaInicio} onChange={e=>{setHoraFin(e.target.value)}}/>
            </div>  
        </div>) : <p>Cargando...</p>}
        {(listaCubiculos.join('')!='' && servicios.join('')!='') ? (
        <div className="lista" id="lista-disponibles">
            {listaFiltrada.map((e) => (
                <div className="cubiculo">
                    <div className="datos">
                        <div className="nombre">
                            <a href={`javascript:void(0);`} onClick={() => {
                                if (minutosSeleccionados <= e.minutosMax || window.confirm(`Seleccionó un rango de ${minutosSeleccionados} minutos, pero este cubículo solo se puede reservar por hasta ${e.minutosMax} minutos, así que la reserva se hará por esta última cantidad de minutos. ¿Continuar?`)) {
                                    navigate(`/Reservar?id=${e.id}&inicio=${fecha +' '+ horaInicio}&salida=${fecha +' '+ horaFin}`)
                                }
                            }}> {e.nombre}</a>
                        </div>
                        <div className="otros-datos">
                            <p><b>Capacidad:</b> {e.capacidad} <b>· Tiempo máximo:</b> {(e.minutosMax >= 60 ? (Math.floor(e.minutosMax/60) + " h") : <></>)} {(e.minutosMax % 60 ? (e.minutosMax % 60 + " min") : <></>)} <b>· Servicios especiales:</b> {((e.servicios && e.servicios.join('') != '') ? (<span class="hoverInfo" title={e.servicios.join('\n')}>Ver lista</span>) : <>Ninguno</>)}</p>
                        </div>
                    </div>
                    <div className="opciones">
                        <FontAwesomeIcon className="iconoOpcion" icon={faCalendarPlus} onClick={() => {
                            if (minutosSeleccionados <= e.minutosMax || window.confirm(`Seleccionó un rango de ${minutosSeleccionados} minutos, pero este cubículo solo se puede reservar por hasta ${e.minutosMax} minutos, así que la reserva se hará por esta última cantidad de minutos. ¿Continuar?`)) {
                                navigate(`/Reservar?id=${e.id}&inicio=${fecha +' '+ horaInicio}&salida=${fecha +' '+ horaFin}`)
                            }
                        }} title="Reservar cubículo" />
                    </div>
                </div>))}
        </div>) : ((ultimoTimestamp) ? <p>Cargando...</p> : <></>)}
        {((listaCubiculos.join('')!='' && servicios.join('')!='') && totalElementos != null) ? (<p class="total"><b>Total de resultados:</b> {totalElementos}</p>) : (<p></p>)}
    </div>
  )
}

export default Disponibles