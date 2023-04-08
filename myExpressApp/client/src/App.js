import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import './App.css'
import Login from './Login'
import EstudianteMenu from './EstudianteMenu'
import Registrarse from './Registrarse'
import Header from './Header'

export default function App() {
  return (
      <>
      <Header />
      <div className="app">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/Registrarse" element={<Registrarse />} />
        </Routes>
      </div>
      </>
  )
}