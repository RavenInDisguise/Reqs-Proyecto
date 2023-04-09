import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import './App.css'
import Login from './Login'
import EstudianteMenu from './EstudianteMenu'
import Registro from './Registro'
import Header from './Header'
import ListaEstudiantes from "./MenuAdministrador/ListaEstudiantes";

export default function App() {
  return (
      <>
      <Header />
      <div className="app">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/Registro" element={<Registro />} />
          <Route path="/Estudiantes" element={<ListaEstudiantes />} />
        </Routes>
      </div>
      </>
  )
}