import React, { useEffect, useState, createContext } from "react";
import { Route, Routes } from "react-router-dom";
import './App.css'
import Login from './Login'
import EstudianteMenu from './EstudianteMenu'
import Registro from './Registro'
import Header from './Header'
import ListaEstudiantes from "./MenuAdministrador/ListaEstudiantes";
import Admin from './Admin'
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
        </Routes>
      </div>
      </>
  )
}