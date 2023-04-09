import React, { useEffect, useState } from "react";
import axios from 'axios';
import './ListaEstudiantes.css';
import '../Tarjeta.css';

export default () => {
    useEffect(() => {
        axios.get('https://localhost:3001/estudiantes').then((response) => {
            console.log(response);
        })
    }, []);

    return (
        <div className="tarjeta Lista-Estudiantes">
            <h1>Gestión de estudiantes</h1>
            <p>Cargando...</p>
        </div>
    )
};