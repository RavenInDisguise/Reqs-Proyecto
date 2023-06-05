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
import java.text.SimpleDateFormat
import java.util.*

class BookingListAdapter(private val elements : List<BookingItem>):
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
            card.findViewById<TextView>(R.id.BookRoomNameText).text = element.nombre
            card.findViewById<TextView>(R.id.BookingDateText).text = convertirFecha(element.fecha)
            card.findViewById<TextView>(R.id.StudentNameInfo).text = element.nombreEstudiante
            card.findViewById<TextView>(R.id.bookingScheduleText).text = unirFechas(element.horaInicio,element.horaFin)

            // Se agrega el listener
            itemView.setOnClickListener {
                // Se obtiene el índice del elemento tocado
                if (adapterPosition != RecyclerView.NO_POSITION) {
                    // Si es un índice válido, entra aquí
                    val clickedItem = elements[adapterPosition]
                    AlertDialog.Builder(itemView.context)
                        .setTitle("Advertencia")
                        .setMessage("Seleccionó la reserva ID:${clickedItem.id}")
                        .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                        .show()

                }
            }
        }
    }
    fun convertirFecha(fecha: String): String {
        val formatoEntrada = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        formatoEntrada.timeZone = TimeZone.getTimeZone("UTC")

        val formatoSalida = SimpleDateFormat("dd 'de' MMMM, h:mm a", Locale.getDefault())
        formatoSalida.timeZone = TimeZone.getDefault()

        val fechaConvertida = formatoEntrada.parse(fecha)
        return formatoSalida.format(fechaConvertida)
    }

    fun unirFechas(horaInicio: String, horaFin: String): String {
        val formatoEntrada = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        formatoEntrada.timeZone = TimeZone.getTimeZone("UTC")

        val formatoSalida = SimpleDateFormat("d 'de' MMMM, 'de' h:mm a", Locale.getDefault())
        formatoSalida.timeZone = TimeZone.getDefault()

        val formatoSalidaFin = SimpleDateFormat("h:mm a", Locale.getDefault())
        formatoSalidaFin.timeZone = TimeZone.getDefault()

        val fechaInicio = formatoEntrada.parse(horaInicio)
        val fechaFin = formatoEntrada.parse(horaFin)

        val horaInicioFormateada = formatoSalida.format(fechaInicio)
        val horaFinFormateada = formatoSalidaFin.format(fechaFin)

        return "$horaInicioFormateada a $horaFinFormateada"
    }
}