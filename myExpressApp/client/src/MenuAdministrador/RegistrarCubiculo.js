import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './RegistrarCubiculo.css';
import '../Tarjeta.css';

function Registrar () {
    const navigate = useNavigate();
    const [nombre, setNombre] = useState();
    const [capacidad, setCapacidad] = useState(0);
    const [servicios, setServicios] = useState([]);
    const [tiempoMaximo, setTiempoMaximo] = useState(0);
    const [estados, setEstados] = useState([]);
    const [estadoActual, setEstadoActual] = useState();
    const [serviciosCargados, setServiciosCargados] = useState(false);
    const [estadosCargados, setEstadosCargados] = useState(false);

    useEffect(() => {
        axios.get("/api/login").then((response) => {
            if(!(response.data.loggedIn && response.data.tipoUsuario == 'Administrador')){
                navigate('/')
            }
        })
        
        axios.get('/api/estados').then((response) => {
            try {
                setEstados(response.data.estados);
                setEstadosCargados(true);
            } catch (error) {
                console.log(error)
                alert('Ocurrió un error al cargar la información');
            }
        })

        axios.get('/api/serviResi').then((response) => {
            try {
                setServicios(response.data.servicios);
                setServiciosCargados(true);
            } catch (error) {
                console.log(error)
                alert('Ocurrió un error al cargar la información');
            }
        })

    }, [])

    

    const actualizarServicios = (elemento) => {
        let newServicios = servicios;
        let serviciosActivos = [];
        let hijo;
        
        for (let child = 0; child < elemento.children.length; child++) {
            hijo = elemento.children[child]
            if (hijo.selected) {
                serviciosActivos.push(hijo.value);
            }
        }

        for (let i = 0; i < newServicios.length; i++) {
            if (serviciosActivos.indexOf(newServicios[i].nombre) != -1) {
                newServicios[i].activo = true;
            } else {
                newServicios[i].activo = false;
            }
        }
        setServicios(servicios);
    }
    
    const handleSubmit = (e) => {
        axios.put('/api/cubiculo/crear', {
            estadoActual,
            nombre,
            capacidad,
            tiempoMaximo,
            servicios: servicios.filter((s) => s.activo).map((s) => s.nombre)
          }).then(res => {
            switch (res.status){
              case 200:
                alert('Registro existoso');
                window.location.reload();
                break;
              default:
                alert('Ocurrió un error');
                break;
            }
          }).catch(function (error) {
            try {
              alert('Ocurrió un error:\n\n- ' + error.response.data.errores.join('\n- '));
            }
            catch {
              alert('Ocurrió un error al Registrar.');
            }
          })
        
        e.preventDefault();
    } 

    return (
        <div className="tarjeta cubiculo-registrar">
            <h3>Registrar cubículo</h3>
            {(estadosCargados && serviciosCargados) ? (
            <form onSubmit={(e) => handleSubmit(e)}>
                <div className="form-group">
                    <div class="form-element">
                        <label for="idNumber">ID</label>
                        <input className="form-control" id="idNumber" type='text' title='Se asignará automáticamente' disabled value={"Se asignará automáticamente"}/>
                    </div>
                    <div class="form-element">
                        <label for="nameInput">Nombre</label>
                        <input className="form-control" id="nameInput" type='text' required value={nombre} placeholder="Nombre del cubículo" onChange={e => setNombre(e.target.value)}/>
                    </div>
                </div>
                <div className="form-group">
                    <label for="estadoSelect">Estado</label>
                    <select id="estadoSelect" onChange={(e) => {setEstadoActual(e.target.value)}}>
                        {(estados.indexOf(estadoActual) == -1) ? (<option value={estadoActual} selected disabled>{estadoActual}</option>) : <></>}
                        {estados.map((e) => ((e == estadoActual) ? <option value={e} selected>{e}</option> : <option value={e}>{e}</option>))}
                    </select>
                </div>
                <div className="form-group">
                    <div class="form-element">
                        <label for="capacityInput">Capacidad</label>
                        <input className="form-control" id="capacityInput" type='number' min={1} step={1} required value={capacidad} placeholder="Capacidad del cubículo" onChange={e => setCapacidad(e.target.value)}/>
                    </div>
                    <div class="form-element">
                        <label for="timeInput">Tiempo máximo (minutos)</label>
                        <input className="form-control" id="timeInput" type='number' min={1} step={1} required value={tiempoMaximo} placeholder="Tiempo máximo de uso" onChange={e => setTiempoMaximo(e.target.value)}/>
                    </div>
                </div>
                <div className="form-group servicios">
                    <label for="serviciosSelect" id="serviciosLabel" title="Utilice la tecla Ctrl para marcar o desmarcar elementos">Servicios especiales</label>
                    <select id="serviciosSelect" multiple size="4" onChange={(e) => actualizarServicios(e.target)} title="Utilice la tecla Ctrl para marcar o desmarcar elementos">
                        {servicios.map((s) => (<option>{s.nombre}</option>))}
                    </select>
                </div>
                    
                <input className="btn btn-primary" type="submit" value="Guardar" />
            </form>
        ) : <p>Cargando...</p>}
        {(estadosCargados && serviciosCargados) ? <a href="javascript:void(0);" onClick={(e) => {navigate(-1)}}>Cancelar</a> : <></>}
        </div>
    )
}

export default Registrar 