package com.example.bibliotec.ui

import android.app.AlertDialog
import android.graphics.Typeface
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.recyclerview.widget.RecyclerView
import com.example.bibliotec.R
import com.example.bibliotec.data.RoomItem

class AvailableRoomAdapter(private val elements : List<RoomItem>) :
    RecyclerView.Adapter<AvailableRoomAdapter.ViewHolder>() {

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
            val capacityString = element.capacidad.toString() + " persona" + if (element.capacidad != 1) {
                "s"
            } else {
                ""
            }

            var maxTimeString = ""

            if (element.minutosMaximo >= 60) {
                maxTimeString = (element.minutosMaximo / 60).toString() + " h"
            }

            if (element.minutosMaximo % 60 > 0) {
                if (!maxTimeString.isEmpty()) {
                    maxTimeString += " "
                }
                maxTimeString += (element.minutosMaximo % 60).toString() + " min"
            }

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
            card.findViewById<TextView>(R.id.AvailableRoomServices).setTypeface(null,
                if (servicesAvailable) {
                    Typeface.NORMAL
                } else {
                    Typeface.ITALIC
                }
            )

            // Se agrega el listener
            itemView.setOnClickListener {
                // Se obtiene el índice del elemento tocado
                if (adapterPosition != RecyclerView.NO_POSITION) {
                    // Si es un índice válido, entra aquí
                    val clickedItem = elements[adapterPosition]

                    AlertDialog.Builder(itemView.context)
                        .setTitle("Ejemplo")
                        .setMessage("Ha presionado el cubículo ${clickedItem.nombre} (ID: ${clickedItem.id})")
                        .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                        .show()
                }
            }
        }
    }
}