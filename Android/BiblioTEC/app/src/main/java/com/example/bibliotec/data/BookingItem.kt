package com.example.bibliotec.data

data class BookingItem(val id:Int,
                       val nombreCubiculo: String,
                       val idCubiculo: Int,
                       val fecha: String,
                       val horaInicio: String,
                       val horaFin: String,
                       val activo: Boolean,
                       val confirmado: Boolean,
                       val nombreEstudiante: String,
                       val idEstudiante: Int)
