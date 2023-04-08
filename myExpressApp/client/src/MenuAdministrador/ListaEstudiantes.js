import React, { useEffect, useState } from "react";
import axios from 'axios';
import './ListaEstudiantes.css';
import '../Tarjeta.css';

export default () => {
    useEffect(() => {
        axios.get('https://localhost:3001/estudiantes').then((response) => {
            
        })
    }, []);
};