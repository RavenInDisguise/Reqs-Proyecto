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
import android.widget.TextView
import androidx.lifecycle.lifecycleScope
import com.example.bibliotec.R
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody


class ReservasFragment : Fragment() {
    private lateinit var sharedPreferences: SharedPreferences
    private val gson = Gson()
    private var studentId: Int? = null
    private lateinit var apiRequest: ApiRequest
    data class Reserva(
        val id: Int,
        val nombre: String,
        val fecha: String,
        val horaInicio: String,
        val horaFin: String,
        val confirmado: Boolean
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
//        arguments?.let {
//            param1 = it.getString(ARG_PARAM1)
//            param2 = it.getString(ARG_PARAM2)
//        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        sharedPreferences = requireContext().getSharedPreferences("UserInfo",Context.MODE_PRIVATE)
        studentId = sharedPreferences.getIntOrNull("studentId")
        apiRequest=ApiRequest.getInstance(requireContext())
        return inflater.inflate(R.layout.fragment_reservas, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val listViewReservas: ListView = view.findViewById(R.id.reserv_list)
        val elementos: MutableList<String> = mutableListOf()

        viewLifecycleOwner.lifecycleScope.launch {
            withContext(Dispatchers.IO) {
                val url = "https://appbibliotec.azurewebsites.net/api/reserva/estudiante?id=$studentId"
                val (responseStatus, responseString) = apiRequest.getRequest(url)
                println("Se hizo la solicitud a $url")
                println(responseStatus)
                if (responseStatus) {
                    println("Se obtuvo la respuesta")
                    println(responseString)
                    val reservaType = object : TypeToken<List<Reserva>>() {}.type
                    val reservas: List<Reserva> = Gson().fromJson(responseString, reservaType)
                    for (reserva in reservas) {
                        val elemento = "${reserva.nombre} Fecha: ${reserva.fecha.substring(0, 10)} de ${reserva.horaInicio.substring(11, 16)} a ${reserva.horaFin.substring(11, 16)}"
                        println(elemento)
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
                                    .setMessage("¿Estás seguro de confirmar esta reserva?")
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
                                    .setMessage("¿Estás seguro de eliminar esta reserva?")
                                    .setPositiveButton("OK") { dialog, _ ->
                                        eliminarReserva(reserva)
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
                    }
                } else {
                    println("Error al obtener las reservas")
                    println(responseString)
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
                                view?.invalidate()
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
        MainScope().launch {
            val url = "https://appbibliotec.azurewebsites.net/api/reserva/eliminar" +
                    "?id=${reserva.id}"
            val emptyRequestBody = "".toRequestBody("application/json".toMediaType())
            withContext(Dispatchers.IO) {
                val (responseStatus, responseString) = apiRequest.putRequest(url, emptyRequestBody)
                requireActivity().runOnUiThread {
                    if (responseStatus) {
                        val dialog = AlertDialog.Builder(requireContext())
                            .setTitle("Confirmado")
                            .setMessage("La reserva fue eliminada")
                            .setPositiveButton("OK") { dialog, _ ->
                                dialog.dismiss()
                                view?.invalidate()
                            }
                            .create()
                        dialog.show()
                    } else {
                        val dialog = AlertDialog.Builder(requireContext())
                            .setTitle("Error")
                            .setMessage("Hubo un error al eliminar la reserva")
                            .setPositiveButton("OK") { dialog, _ ->
                                dialog.dismiss()
                            }
                            .create()
                        dialog.show()
                    }
                }

                println("URL de eliminación: $url")
            }
        }
    }


    private fun SharedPreferences.getIntOrNull(key: String): Int? {
        // Función para retornar un Int solo si existe
        if (contains(key)) {
            return getInt(key, 0) // Retorna el valor almancenado
        }
        return null // Retorna un valor nulo
    }
}
