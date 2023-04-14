import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './RegistrarCubiculo.css';
import '../Tarjeta.css';

const opciones = [{nombre: "Disponible", activo: true}, {nombre: "En mantenimiento", activo: false}];

function Registrar () {
    const navigate = useNavigate();
    const [nombre, setNombre] = useState();
    const [capacidad, setCapacidad] = useState(0);
    const [idEstado, setidEstado] = useState(2);
    const [servicios, setServicios] = useState([]);
    const [activados, setActivados] = useState(0);
    const [desactivados, setDesactivados] = useState(0);
    const [activos, setActivos] = useState(0);
    const [tiempoMaximo, setTiempoMaximo] = useState(0);
    const [infoCargada, setInfoCargada] = useState(true);
    const [estados, setEstados] = useState([]);
    const [estadoActual, setEstadoActual] = useState();

    async function submit(e) {
        e.preventDefault();
    
        await axios.post('/cubiculo/crear',
        {
          estadoActual,
          nombre,
          capacidad,
          tiempoMaximo
        })
          .then(res => {
            switch (res.status){
              case 200:
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
              alert('Ocurrió un error Registrando.');
            }
          })
    }
 
    useEffect(() => {
        axios.get("http://localhost:3001/login").then((response) => {
            if(!(response.data.loggedIn && response.data.tipoUsuario == 'Administrador')){
                navigate('/')
            }
        })
        
        axios.get('/estados').then((response) => {
            try {
                setEstados(response.data.estados)
            } catch (error) {
                console.log(error)
                alert('Ocurrió un error al cargar la información');
            }
        })

        axios.get('/serviResi').then((response) => {
            try {
                setServicios(response.data.servicios)
            } catch (error) {
                console.log(error)
                alert('Ocurrió un error al cargar la información');
            }
        })

    }, [])

    

    const actualizarServicios = (elemento) => {
        let newServicios = servicios;
        console.log("REGISTRO: ", newServicios);
        let serviciosActivos = [];
        let hijo;
        
        for (let child = 0; child < elemento.children.length; child++) {
            hijo = elemento.children[child]
            if (hijo.selected) {
                serviciosActivos.push(hijo.value);
            }
        }

        let activados = 0, desactivados = 0, activos = 0;

        for (let i = 0; i < newServicios.length; i++) {
            if (serviciosActivos.indexOf(newServicios[i].nombre) != -1) {
                newServicios[i].activo = true;
                if (!newServicios[i].anterior) {
                    activados++;
                } else {
                    activos++;
                }
            } else {
                newServicios[i].activo = false;
                if (newServicios[i].anterior) {
                    desactivados++;
                }
            }
        }
        setServicios(newServicios);
        setActivados(activados);
        setDesactivados(desactivados);
        setActivos(activos);

        document.getElementById('serviciosSelect').blur();
    }
    
    const handleSubmit = (e) => {
        axios.put('/cubiculo/crear', {
            estadoActual,
            nombre,
            capacidad,
            tiempoMaximo
            //servicios: servicios
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
        (infoCargada) ? (<div className="tarjeta cubiculo-registrar">
            <h3>Registrar cubículo</h3>
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
                        {servicios.map((s) => ((s.activo) ? (
                            <option className={((s.anterior) ? "activo" : "inactivo") + " servicioOption"} selected>{s.nombre}</option>
                        ) : (
                            <option className={((s.anterior) ? "activo" : "inactivo") + " servicioOption"}>{s.nombre}</option>
                        )))}
                    </select>
                </div>
                    
                <input className="btn btn-primary" type="submit" value="Guardar" />
            </form>
            <a href="javascript:void(0);" onClick={(e) => {navigate(-1)}}>Cancelar</a>
        </div>) : <></>
    )
}

export default Registrar 