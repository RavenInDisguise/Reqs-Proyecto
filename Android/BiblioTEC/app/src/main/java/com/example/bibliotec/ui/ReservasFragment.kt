package com.example.bibliotec.ui

import android.app.AlertDialog
import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import com.example.bibliotec.api.ApiRequest
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.ListView
import android.widget.ProgressBar
import android.widget.TextView
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.example.bibliotec.R
import com.example.bibliotec.misc.LocalDate
import com.example.bibliotec.user.User
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody

class ReservasFragment : Fragment() {
    private val gson = Gson()
    private var studentId: Int? = null
    private lateinit var apiRequest: ApiRequest
    private lateinit var user: User
    data class Reserva(
        val id: Int,
        val nombre: String,
        val fecha: String,
        val horaInicio: String,
        val horaFin: String,
        val activo: Boolean,
        val confirmado: Boolean
    )

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        user = User.getInstance(requireContext())
        studentId = user.getStudentId()

        apiRequest=ApiRequest.getInstance(requireContext())
        return inflater.inflate(R.layout.fragment_reservas, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val listViewReservas: ListView = view.findViewById(R.id.reserv_list)
        val elementos: MutableList<String> = mutableListOf()

        val progressBar : ProgressBar = view.findViewById(R.id.progressBar)

        viewLifecycleOwner.lifecycleScope.launch {
            withContext(Dispatchers.IO) {
                val url = "https://appbibliotec.azurewebsites.net/api/reserva/estudiante?id=$studentId"
                val (responseStatus, responseString) = apiRequest.getRequest(url)
                if (responseStatus) {
                    val reservaType = object : TypeToken<List<Reserva>>() {}.type
                    val reservas: List<Reserva> = gson.fromJson(responseString, reservaType)
                    for (reserva in reservas) {
                        val elemento = """Cubículo: ${reserva.nombre}
                            |Estado: ${if (reserva.activo) if (reserva.confirmado) "Confirmada" else "Activa" else "Inactiva"}
                            |Hecha: ${LocalDate.dateTime(reserva.fecha, true)}
                            |Horario reservado:
                            |      ${LocalDate.date(reserva.horaInicio, true)},
                            |      de ${LocalDate.time(reserva.horaInicio, true)} a ${LocalDate.time(reserva.horaFin, true)}""".trimMargin()
                        elementos.add(elemento)
                    }

                    val adapter = object : ArrayAdapter<String>(
                        requireContext(),
                        R.layout.list_item_layout,
                        R.id.item_text,
                        elementos
                    ) {
                        override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
                            val view = super.getView(position, convertView, parent)

                            val itemText = view.findViewById<TextView>(R.id.item_text)
                            val buttonConfirmar = view.findViewById<Button>(R.id.button_confirmar)
                            val buttonEliminar = view.findViewById<Button>(R.id.button_eliminar)
                            val reservaConfirmada = reservas[position].confirmado

                            // Actualizar el estado del botón Confirmar
                            buttonConfirmar.isEnabled = !reservaConfirmada

                            val reserva = reservas[position]
                            itemText.text = elementos[position]

                            // Acciones al hacer clic en el botón Confirmar
                            buttonConfirmar.setOnClickListener {
                                val confirmDialog = AlertDialog.Builder(requireContext())
                                    .setTitle("Confirmación")
                                    .setMessage("¿Está seguro de confirmar esta reserva?")
                                    .setPositiveButton("OK") { dialog, _ ->
                                        confirmarReserva(reserva)
                                        dialog.dismiss()
                                    }
                                    .setNegativeButton("Cancelar") { dialog, _ ->
                                        dialog.dismiss()
                                    }
                                    .create()
                                confirmDialog.show()
                            }

                            // Acciones al hacer clic en el botón Eliminar
                            buttonEliminar.setOnClickListener {
                                val deleteDialog = AlertDialog.Builder(requireContext())
                                    .setTitle("Confirmación")
                                    .setMessage("¿Está seguro de eliminar esta reserva?")
                                    .setPositiveButton("OK") { dialog, _ ->
                                        //eliminarReserva(reserva)
                                        dialog.dismiss()
                                    }
                                    .setNegativeButton("Cancelar") { dialog, _ ->
                                        dialog.dismiss()
                                    }
                                    .create()
                                deleteDialog.show()
                            }

                            return view
                        }
                    }

                    withContext(Dispatchers.Main) {
                        listViewReservas.adapter = adapter
                        progressBar.visibility = View.GONE
                    }
                } else {
                    if (user.isLoggedIn()) {
                        // Ocurrió un error al hacer la consulta
                        requireActivity().runOnUiThread() {
                            AlertDialog.Builder(requireContext())
                                .setTitle("Error")
                                .setMessage(responseString)
                                .setPositiveButton("OK") { dialog, _ ->
                                    dialog.dismiss()
                                    findNavController().navigateUp()
                                }
                                .show()
                        }
                    } else {
                        // La sesión expiró
                        requireActivity().runOnUiThread() {
                            AlertDialog.Builder(requireContext())
                                .setTitle(R.string.session_timeout_title)
                                .setMessage(R.string.session_timeout)
                                .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                                .show()
                            findNavController().navigate(R.id.LoginFragment)
                        }
                    }
                }
            }
        }
    }




    private fun confirmarReserva(reserva: Reserva) {
        MainScope().launch {
            val url = "https://appbibliotec.azurewebsites.net/api/reserva/confirmar" +
                    "?id=${reserva.id}&nombre=${reserva.nombre}&horaInicio=${reserva.horaInicio}&horaFin=${reserva.horaFin}"
            val emptyRequestBody = "".toRequestBody("application/json".toMediaType())
            println("ayeye")
            println(url)
            withContext(Dispatchers.IO) {
                val (responseStatus, responseString) = apiRequest.putRequest(url, emptyRequestBody)
                println("juyajeeee")
                println(responseStatus)
                println(responseString)
                requireActivity().runOnUiThread {
                    if (responseStatus) {
                        val dialog = AlertDialog.Builder(requireContext())
                            .setTitle("Confirmado")
                            .setMessage("La reserva fue confirmada")
                            .setPositiveButton("OK") { dialog, _ ->
                                dialog.dismiss()
                            }
                            .create()
                        dialog.show()
                    } else {
                        val dialog = AlertDialog.Builder(requireContext())
                            .setTitle("Error")
                            .setMessage("Hubo un error al confirmar la reserva")
                            .setPositiveButton("OK") { dialog, _ ->
                                dialog.dismiss()
                            }
                            .create()
                        dialog.show()
                    }
                }

                println("URL de confirmación: $url")
            }
        }
    }


    private fun eliminarReserva(reserva: Reserva) {
//        val url = "https://appbibliotec.azurewebsites.net/api/reserva/eliminar" +
//                "?id=${reserva.id}&nombre=${reserva.nombre}&horaInicio=${reserva.horaInicio}&horaFin=${reserva.horaFin}"
//
//        println("URL de eliminación: $url")

        // Realizar la solicitud HTTP para eliminar la reserva utilizando la URL generada
        // y realizar las acciones necesarias después de la eliminación.
    }


    private fun SharedPreferences.getIntOrNull(key: String): Int? {
        // Función para retornar un Int solo si existe
        if (contains(key)) {
            return getInt(key, 0) // Retorna el valor almancenado
        }
        return null // Retorna un valor nulo
    }
}
