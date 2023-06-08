package com.example.bibliotec.ui

import android.app.AlertDialog
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.navigation.findNavController
import androidx.recyclerview.widget.RecyclerView
import com.example.bibliotec.R
import com.example.bibliotec.data.RoomItem
import com.example.bibliotec.misc.LocalDate

class AvailableRoomAdapter(
    private val elements: List<RoomItem>,
    horaInicio: String,
    horaFin: String
) :
    RecyclerView.Adapter<AvailableRoomAdapter.ViewHolder>() {
    private val horaInicio = horaInicio
    private val horaFin = horaFin
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.available_room_card, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val element = elements[position]
        holder.bind(element)
    }

    override fun getItemCount(): Int {
        return elements.size
    }

    inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val card: ConstraintLayout = itemView.findViewById(R.id.AvailableRoomCard)

        fun bind(element: RoomItem) {
            val capacityString =
                element.capacidad.toString() + " persona" + if (element.capacidad != 1) {
                    "s"
                } else {
                    ""
                }

            var maxTimeString = LocalDate.durationString(element.minutosMaximo)

            var servicesAvailable = !element.servicios.isNullOrEmpty()
            var servicesString = if (servicesAvailable) {
                element.servicios.joinToString("\n")
            } else {
                "Sin servicios especiales"
            }

            card.findViewById<TextView>(R.id.AvailableRoomText).text = element.nombre
            card.findViewById<TextView>(R.id.AvailableRoomCapacity).text = capacityString
            card.findViewById<TextView>(R.id.AvailableRoomTime).text = maxTimeString
            card.findViewById<TextView>(R.id.AvailableRoomServices).text = servicesString
            card.findViewById<TextView>(R.id.AvailableRoomServices).setTypeface(
                null,
                if (servicesAvailable) {
                    Typeface.NORMAL
                } else {
                    Typeface.ITALIC
                }
            )

            if (element.servicios.size < 2) {
                card.findViewById<LinearLayout>(R.id.serviceLayout).gravity = Gravity.CENTER
            } else {
                card.findViewById<LinearLayout>(R.id.serviceLayout).gravity = Gravity.TOP
            }

            // Se agrega el listener
            itemView.setOnClickListener {
                // Se obtiene el índice del elemento tocado
                if (adapterPosition != RecyclerView.NO_POSITION) {
                    // Si es un índice válido, entra aquí
                    val clickedItem = elements[adapterPosition]

                    val bundle = Bundle()

                    bundle.putString("horaInicio", horaInicio)
                    bundle.putString("horaFin", horaFin)
                    bundle.putInt("cubiculoId", clickedItem.id)

                    // Se revisa si se excede el tiempo máximo
                    val horaInicioObject = LocalDate.parseUtc(horaInicio)
                    val horaFinObject = LocalDate.parseUtc(horaFin)
                    val selectedMins = (horaFinObject.time - horaInicioObject.time) / (1000 * 60)

                    if (selectedMins > clickedItem.minutosMaximo) {
                        val maxTimeString = LocalDate.durationString(clickedItem.minutosMaximo)
                        val selectedMinsString = LocalDate.durationString(selectedMins.toInt())
                        AlertDialog.Builder(itemView.context)
                            .setTitle("Advertencia")
                            .setMessage(
                                "Este cubículo se puede reservar por un máximo de ${
                                    maxTimeString
                                }, pero seleccionó un rango de ${
                                    selectedMinsString
                                }.\n\nSi continúa, reservará el cubículo por el tiempo máximo (${
                                    maxTimeString
                                }). ¿Desea continuar?"
                            )
                            .setPositiveButton("OK") { dialog, which ->
                                itemView.findNavController().navigate(
                                    R.id.action_AvailableRoomsFragment_toRegistroFragment,
                                    bundle
                                )
                            }
                            .setNegativeButton("Cancelar") { dialog, which ->
                                // Handle Cancel button click
                                // Optionally perform any cleanup or additional actions
                            }
                            .show()
                    } else {
                        itemView.findNavController().navigate(
                            R.id.action_AvailableRoomsFragment_toRegistroFragment,
                            bundle
                        )
                    }
                }
            }
        }
    }
}