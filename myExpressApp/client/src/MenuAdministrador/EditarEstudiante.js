import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import '../Tarjeta.css';
import './EditarEstudiante.css'

function EditarEstudiante() {

    axios.defaults.withCredentials = true;
    const navigate = useNavigate();
    const parametros = new URLSearchParams('?' + document.URL.split('/').at(-1).split('?').at(-1));
    const idEstudiante =  parametros.get('id');
    const [nombre, setNombre] = useState(null)
    const [apellido1, setApellido1] = useState(null)
    const [apellido2, setApellido2] = useState(null)
    const [carnet, setCarnet] = useState(null)
    const [cedula, setCedula] = useState(null)
    const [correo, setCorreo] = useState(null)
    const [fechaNacimiento, setFechaNacimiento] = useState(null)
    const [clave, setClave] = useState(null)

    useEffect(()=>{

        axios.get(`estudiante?id=${idEstudiante}`)
        .then((response) => {
            try {
                console.log(response.data)
                setNombre(response.data.nombre);
                setApellido1(response.data.apellido1);
                setApellido2(response.data.apellido2);
                setCarnet(response.data.carnet);
                setCedula(response.data.cedula);
                setCorreo(response.data.correo);
                setFechaNacimiento(response.data.fechaDeNacimiento);
            } catch (error) {
                alert('Ocurrió un error al cargar la información');
            }
        });
    },[])

    function handleSubmit(e){
        e.preventDefault();
        
    }

    return (
        <div className="tarjeta estudiante-editar">
            <h3>Editar Estudiante</h3>
            <form action="" onSubmit={(e)=>{handleSubmit(e)}}>
                <div className="form-group">
                    <label for='idEstudiante'>ID</label>
                    <input className="form-control" id="idEstudiante" type='number' title='No es posible cambiar el ID del estudiante' disabled value={idEstudiante}/>
                </div>
                <div className="form-group">
                    <label for='nombreEst'>Nombre</label>
                    <input className="form-control" id="nombreEst" type="text" value={nombre} onChange={e => setNombre(e.target.value)} />
                </div>
                <div className="form-group">
                    <label for='apellido1'>Apellido 1</label>
                    <input className="form-control" id="apellido1" type="text" value={apellido1} onChange={e=>setApellido1(e.target.value)} />
                </div>
                <div className="form-group">
                    <label for='apellido2'>Apellido 2</label>
                    <input className="form-control" id="apellido2" type="text" value={apellido2} onChange={e=>setApellido2(e.target.value)} />
                </div>
                <div className="form-group">
                    <label for='cedula'>Cedula</label>
                    <input className="form-control" id="cedula" type="number" value={cedula} onChange={e=>setCedula(e.target.value)} />
                </div>
                <div className="form-group">
                    <label for='carnet'>Carnet</label>
                    <input className="form-control" id="carnet" type="number" value={carnet} onChange={e=>setCarnet(e.target.value)} />
                </div>
                <div className="form-group">
                    <label for=''>Correo Institucional</label>
                    <input className="form-control" id="correo" type='email' value={correo} onChange={e=>setCorreo(e.target.value)} />
                </div>
                <div className="form-group">
                    <label for='Fecha'>Fecha de Nacimiento</label>
                    <input className="form-control" id="Fecha" type="date" value={fechaNacimiento} onChange={e=>setFechaNacimiento(e.target.value)} />
                </div>
                <div className="form-group">
                    <label for='Clave'>Clave</label>
                    <input className="form-control" id="Clave" type="password" value={clave} onChange={e=>setClave(e.target.value)} />
                </div>
                <input className="btn btn-primary" type="submit" value="Guardar" />
            </form>
        </div>
    )
}

export default EditarEstudiante