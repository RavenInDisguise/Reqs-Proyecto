package com.example.bibliotec.data

data class BookingRoom(val id: Int,
                       val nombre: String,
                       val capacidad: Int,
                       val estado: String,
                       val reservas: Int,
                       val minutosMaximo: Int,
                       val servicios: List<ServicePerRoom>)
