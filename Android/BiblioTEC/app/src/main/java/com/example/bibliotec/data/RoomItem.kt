package com.example.bibliotec.data

data class RoomItem(val id: Int, val nombre: String, val estado: String, val capacidad: Int, val minutosMaximo: Int, val servicios: List<String>)