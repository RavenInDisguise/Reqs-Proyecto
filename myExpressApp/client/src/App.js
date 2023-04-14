import React, { useEffect, useState, createContext } from "react";
import { Route, Routes } from "react-router-dom";
import './App.css'
import Login from './Login'
import EstudianteMenu from './EstudianteMenu'
import Registro from './Registro'
import Header from './Header'
import ListaEstudiantes from "./MenuAdministrador/ListaEstudiantes";
import Admin from './MenuAdministrador/Admin'
import Disponibles from "./Disponibles";
import ListaCubiculo from './MenuAdministrador/ListaCubiculo'
import EditarCubiculo from "./MenuAdministrador/EditarCubiculo";
import Reservar from "./Reservar";
import VerReservas from "./MenuAdministrador/VerReservas";
import Apartados from "./Apartados";
import RegistrarCubiculo from "./MenuAdministrador/RegistrarCubiculo"
import EditarReserva from "./MenuAdministrador/EditarReserva";
import EditarEstudiante from "./MenuAdministrador/EditarEstudiante";
import Error404 from "./Error404";

export const LoginContext = createContext();

export default function App() {

  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <>
      <LoginContext.Provider value={[loggedIn,setLoggedIn]}>
        <Header />
      </LoginContext.Provider>
      
      <div className="app">
          <Routes>
            <Route path="/" element={
              <LoginContext.Provider value={[loggedIn,setLoggedIn]}>
                <Login />
              </LoginContext.Provider>} />
            <Route path="/Menu" element={<EstudianteMenu />}/>
            <Route path="/Admin" element={<Admin />}/>
            <Route path="/Registro" element={<Registro />} />
            <Route path="/Estudiantes" element={<ListaEstudiantes />} />
            <Route path="/Disponibles" element={<Disponibles />} />
            <Route path="/Cubiculos" element={<ListaCubiculo />} />
            <Route path="/EditarCubiculo" element={<EditarCubiculo />} />
            <Route path="/Reservar" element={<Reservar />} />
            <Route path="/Apartados" element={<Apartados/>} />
            <Route path="/AdminReservas" element={<VerReservas />} />
            <Route path="/RegistrarCubiculo" element={<RegistrarCubiculo />} />
            <Route path="/EditarReserva" element={<EditarReserva />}/>
            <Route path="/Estudiante" element={<EditarEstudiante/>}/>
            <Route path="*" element={<Error404 />} />
        </Routes>
      </div>
    </>
  )
}