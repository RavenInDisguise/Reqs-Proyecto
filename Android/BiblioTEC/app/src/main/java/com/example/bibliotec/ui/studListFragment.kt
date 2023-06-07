package com.example.bibliotec.ui

import android.app.AlertDialog
import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.ListView
import android.widget.TextView
import androidx.lifecycle.lifecycleScope
import androidx.navigation.findNavController
import com.example.bibliotec.R
import com.example.bibliotec.api.ApiRequest
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody

class studListFragment : Fragment() {
    private lateinit var sharedPreferences: SharedPreferences
    private var studentId: Int? = null
    private lateinit var apiRequest: ApiRequest

    data class Estudiante(
        val id: Int,
        val Nombre: String,
        val carnet: Long,
        val cedula: Int,
        val correo: String,
        val activo: Boolean
    )


    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        sharedPreferences = requireContext().getSharedPreferences("UserInfo", Context.MODE_PRIVATE)
        studentId = sharedPreferences.getIntOrNull("studentId")
        apiRequest=ApiRequest.getInstance(requireContext())
        return inflater.inflate(R.layout.fragment_stud_list, container, false)

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val listViewEstudiante: ListView = view.findViewById(R.id.lista_estudiantes)
        val elementos: MutableList<String> = mutableListOf()
        viewLifecycleOwner.lifecycleScope.launch{
            withContext(Dispatchers.IO){
                val url = "https://appbibliotec.azurewebsites.net/api/estudiante/estudiantes"
                val (responseStatus, responseString) = apiRequest.getRequest(url)
                println("Se hizo la solicitud a $url")
                println(responseStatus)
                if (responseStatus) {
                    val estudianteType = object : TypeToken<List<Estudiante>>() {}.type
                    val estudiantes: List<Estudiante> = Gson().fromJson(responseString, estudianteType)
                    for (estud in estudiantes) {
                        val elemento = "Nombre: ${estud.Nombre} \nCarnet: ${estud.carnet} \nCedula: ${estud.cedula} \n\n"
                        println(elemento)
                        elementos.add(elemento)
                    }
                    val adapter = object : ArrayAdapter<String>(
                        requireContext(),
                        R.layout.admin_list_item_layout,
                        R.id.item_text,
                        elementos
                    ){
                        override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
                            val view = super.getView(position, convertView, parent)

                            val itemText = view.findViewById<TextView>(R.id.item_text)
                            val buttonEditar = view.findViewById<Button>(R.id.button_editar)
                            val buttonReservas = view.findViewById<Button>(R.id.btnReservas)
                            val estudent = estudiantes[position]
                            itemText.text = elementos[position]

                            // Acciones al hacer clic en el botón Confirmar
                            buttonEditar.setOnClickListener {
                                val bundle = Bundle()
                                bundle.putInt("id",estudent.id)
                                //view.findNavController().navigate(R.id.action_cubiListFragment_to_ModifyRoomFragment)
                            }
                            buttonReservas.setOnClickListener {
                                val bundle = Bundle()
                                bundle.putInt("idEstudiante",estudent.id)
                                view.findNavController().navigate(R.id.action_studList_to_bookingList, bundle)
                            }

                            // Acciones al hacer clic en el botón Eliminar

                            return view
                        }
                    }
                    withContext(Dispatchers.Main) {
                        listViewEstudiante.adapter = adapter
                    }
                } else {
                    println("Error al obtener los cubiculos")
                    println(responseString)
                }

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