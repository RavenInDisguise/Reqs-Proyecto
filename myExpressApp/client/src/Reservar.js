import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './Tarjeta.css';
import './Reservar.css';

const idiomaLocal = ['es-CR', 'es'];
const formatoFecha = { month: 'long', day: 'numeric'};
const formatoHora = {hour12: true, hour: 'numeric', minute: 'numeric'};

function Reservar() {

    axios.defaults.withCredentials = true;
    const navigate = useNavigate();
    const parametros = new URLSearchParams('?' + document.URL.split('/').at(-1).split('?').at(-1));
    const idCubiculo = parametros.get('id');
    const horaInicio = parametros.get('inicio');
    const horaFin = parametros.get('salida');

    const [dateInicio, setDateInicio] = useState(() => {
        try {
            return new Date(horaInicio);
        } catch (error) {
            console.dir(error);
            navigate(-1);
        }
    });
    const [dateFin, setDateFin] = useState(() => {
        try {
            return new Date(horaFin);
        } catch (error) {
            console.dir(error);
            navigate(-1);
        }
    });
    let minsIniciales;

    if (dateFin <= dateInicio) {
        navigate(-1);
    } else {
        minsIniciales = ((dateFin - dateInicio ) / (1000 /* milisegundos */ * 60 /* segundos por minuto */));
    }

    const [nombre, setNombre] = useState();
    const [capacidad, setCapacidad] = useState(0);
    const [servicios, setServicios] = useState([]);
    const [tiempoMaximo, setTiempoMaximo] = useState(0);
    const [idEstudiante, setIdEstudiante] = useState(null)
    const [email, setEmail] = useState('')
    const [minutosSeleccionados, setMinutosSeleccionados] = useState(0);

    useEffect(() => {
        axios.get("/api/login").then((response) => {
            if(response.data.loggedIn && response.data.tipoUsuario == 'Estudiante'){
                setIdEstudiante(response.data.idEstudiante);
                setEmail(response.data.email);
            }else{
                navigate('/')
            }
        })

        if (!idCubiculo || !horaInicio || !horaFin) {
            navigate(-1);
        } else {
            axios.get('/cubiculo?id=' + idCubiculo).then((response) => {
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
                    if (minsIniciales > info[0].minutosMaximo) {
                        setDateFin(new Date(dateInicio.valueOf() + info[0].minutosMaximo * 60000));
                        setMinutosSeleccionados(info[0].minutosMaximo);
                    } else {
                        setMinutosSeleccionados(minsIniciales);
                    }
                    
                } catch (error) {
                    console.log(error)
                    alert('Ocurrió un error al cargar la información');
                }
            })
        }
    }, [])

        function reservar(e){
            e.preventDefault();
            const horaInicioJSON = dateInicio.toISOString().replace("T", " ").replace("Z", "");
            const horaFinJSON = dateFin.toISOString().replace("T", " ").replace("Z", "");
            axios.post('/cubiculo/reservar',{idCubiculo, idEstudiante,horaInicio: horaInicioJSON, horaFin: horaFinJSON,email, nombre}).then((response)=>{
                try{
                    alert(response.data.message)
                    navigate('/Apartados')
                }
                catch{
                    alert('Hubo un error en la reserva')
                }
            })
        }

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
    <div className="tarjeta reservar">
        <h1>Reservar cubículo</h1>
        {(nombre) ?
        <form action="" onSubmit={(e) => {reservar(e)}}>
            <div className='Cubiculo-datos'>
                <div className="form-group">
                    <label for='nombre-cubiculo'>Nombre</label>
                    <input id='nombre-cubiculo' value={nombre} disabled/>
                </div>
                <div className="form-group">
                    <label for='capacidad-cubiculo'>Capacidad</label>
                    <input id='capacidad-cubiculo' value={capacidad} disabled/>
                </div>
                <div className="form-group">
                    <label for='TiempoMax-cubiculo'>Horario seleccionado</label>
                    <input id='TiempoMax-cubiculo' value={'El ' + formatoLocal(dateInicio).replace(", ", ", de las ") + ' hasta las ' + formatoLocal(dateFin, false, true) + ' (' + minutosSeleccionados + ' minutos)'} disabled/>
                </div>
                <div className="form-group">
                    <p>Servicios especiales:</p>
                    <ul style={ { "text-align": "left" } }>
                        {servicios.filter((servicio) => (servicio.activo)).map(servicio =>(<li>{servicio.nombre}</li>))}
                        {(servicios.filter((servicio) => (servicio.activo)).length == 0) ? <li>Ninguno</li> : <></>}
                    </ul>
                </div>
            </div>
            <input className="btn btn-primary" type="submit" value="Reservar" />
        </form> : <p>Cargando...</p>}
    </div>
  )
}

export default Reservar;