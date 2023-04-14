import React, { useEffect, useState, useContext } from "react";
import {useNavigate} from "react-router-dom";
import axios from 'axios';
import { LoginContext, IdEstContext } from "../App";
import '../Menu.css';
import '../Tarjeta.css';

function Admin() {
    const navigate = useNavigate()
    const [loggedIn, setLoggedIn] = useState('')
    
    useEffect(() => {
        axios.get("/api/login").then((response) => {
            setLoggedIn(response.data.loggedIn);
            if(!response.data.loggedIn){
                navigate('/')
            }    
        })
    }, [])

  return (
    <div className='Menu tarjeta'>
        <div className='container' id='cubiculos-menu'>
            <h1>Gestionar cubículos</h1>
            <ul>
                <li><a href="/RegistrarCubiculo" onClick={(e) => {navigate("/RegistrarCubiculo"); e.preventDefault();}}>Agregar cubículo</a></li>
                <li><a href="/Cubiculos" onClick={(e) => {navigate("/Cubiculos"); e.preventDefault();}}>Gestionar cubículos existentes</a></li>
            </ul>
            <h1>Gestionar estudiantes</h1>
            <ul>
                <li><a href="/Estudiantes" onClick={(e) => {navigate("/Estudiantes"); e.preventDefault();}}>Ver estudiantes</a></li>
            </ul>
            <h1>Gestionar reservas</h1>
            <ul>
                <li><a href="/AdminReservas" onClick={(e) => {navigate("/AdminReservas"); e.preventDefault();}}>Ver reservas</a></li>
            </ul>
        </div>
    </div>
  )
}

export default Admin