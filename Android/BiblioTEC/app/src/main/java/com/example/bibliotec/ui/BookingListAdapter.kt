package com.example.bibliotec.ui

import android.app.AlertDialog
import android.graphics.Typeface
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.navigation.findNavController
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.RecyclerView
import com.example.bibliotec.R
import com.example.bibliotec.data.BookingItem
import com.example.bibliotec.misc.LocalDate
import java.text.SimpleDateFormat
import java.util.*

class BookingListAdapter(private val elements: List<BookingItem>) :
    RecyclerView.Adapter<BookingListAdapter.ViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.booking_card, parent, false)
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
        private val card: ConstraintLayout = itemView.findViewById(R.id.BookingCard)

        fun bind(element: BookingItem) {
            card.findViewById<TextView>(R.id.BookingIdText).text = element.id.toString()
            card.findViewById<TextView>(R.id.BookRoomNameText).text = "${element.nombreCubiculo} (ID: ${element.idCubiculo})"
            card.findViewById<TextView>(R.id.BookingDateText).text =
                LocalDate.dateTime(element.fecha, true)
            card.findViewById<TextView>(R.id.StudentNameInfo).text = element.nombreEstudiante
            card.findViewById<TextView>(R.id.bookingScheduleText).text = "${
                LocalDate.date(element.horaInicio,true)}, de ${
                LocalDate.time(element.horaInicio, true)} a ${
                LocalDate.time(element.horaFin, true)}"

            // Se agrega el listener
            itemView.setOnClickListener {
                // Se obtiene el índice del elemento tocado
                if (adapterPosition != RecyclerView.NO_POSITION) {
                    // Si es un índice válido, entra aquí
                    val clickedItem = elements[adapterPosition]
                    AlertDialog.Builder(itemView.context)
                        .setTitle("Advertencia")
                        .setMessage("Seleccionó la reserva ID: ${clickedItem.id}")
                        .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                        .show()

                }
            }
        }
    }
}