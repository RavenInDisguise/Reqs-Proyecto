import React, { useEffect, useState } from "react";
import axios from 'axios';
import './Disponibles.css';
import './Tarjeta.css';

var today = new Date()
var fechaHoy = today.toISOString().replace(/T.+/, "")
var hora = today.toISOString().replace(/.+T/, "").replace(/\..*/, "").split(":").slice(0,2).join(':')

function Disponibles() {
    axios.defaults.withCredentials = true;
    const [listaCubiculos, setListaCubiculos] = useState([]);
    const [fecha, setFecha] = useState(fechaHoy)
    const [horaInicio, setHoraInicio] = useState(hora)
    const [horaFin, setHoraFin] = useState(hora)

    useEffect(() => {
        async function getData(){
            await axios.get(`http://localhost:3001/cubiculos/disponibles?horaInicio=${fecha +' '+ horaInicio}&horaFin=${fecha + ' '+ horaFin}`,).then((response) => {
                try {
                    setListaCubiculos(response.data)
                } catch (error) {
                    alert('Ocurrió un error al cargar la información');
                }
            });
        }  
        getData();
    }, []);

    useEffect(() => {
        async function getData(){
            await axios.get(`http://localhost:3001/cubiculos/disponibles?horaInicio=${fecha +' '+ horaInicio}&horaFin=${fecha + ' '+ horaFin}`,).then((response) => {
                try {
                    console.log('Entras')
                    setListaCubiculos(response.data)
                } catch (error) {
                    alert('Ocurrió un error al cargar la información');
                }
            });
        }  
        getData();
    }, [horaInicio, horaFin, fecha]);

  return (
    <div className="tarjeta Lista-Cubiculos">
        <h1>Reservar un cubículo</h1>
        <div className="filtros">
            <div className="filtro">
                <label for='fecha'>Fecha:</label>
                <input type="date" id="fecha" value={fecha} onChange={e=>{setFecha(e.target.value)}}/>
                <label for="inicio">Hora de entrada:</label>
                <input type="time" id="inicio" name="inicio" value={horaInicio} onChange={e=>{setHoraInicio(e.target.value)}}/>
                <label for="fin">Hora de salida:</label>
                <input type="time" id="fin" name="fin" value={horaFin} onChange={e=>{setHoraFin(e.target.value)}}/>
            </div>  
        </div>
        <div className="lista" id="lista-disponibles">
            {listaCubiculos.map((e) => (
                <div className="cubiculo">
                    <div className="datos">
                        <div className="nombre">
                            <a href={`/Reservar?id=${e.id}&inicio=${fecha +' '+ horaInicio}`}> {e.nombre}</a>
                        </div>
                        <div className="otros-datos">
                            <p><b>Capacidad:</b> {e.capacidad} <b>· Tiempo máximo:</b> {(e.minutosMax >= 60 ? (Math.floor(e.minutosMax/60) + " h") : <></>)} {(e.minutosMax % 60 ? (e.minutosMax % 60 + " min") : <></>)} <b>· Servicios especiales:</b> {((e.servicios && e.servicios.join('') != '') ? (<span class="hoverInfo" title={e.servicios.join('\n')}>Ver lista</span>) : <>Ninguno</>)}</p>
                        </div>
                    </div>
                </div>))}
        </div>
    </div>
  )
}

export default Disponibles