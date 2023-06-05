package com.example.bibliotec.data

data class BookingItem(val id:Int,
                       val nombre: String,
                       val fecha: String,
                       val horaInicio: String,
                       val horaFin: String,
                       val activo: Boolean,
                       val confirmado: Boolean,
                       val nombreEstudiante: String,
                       val idEstudiante: Int)
