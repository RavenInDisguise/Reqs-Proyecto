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
import androidx.navigation.fragment.findNavController
import com.example.bibliotec.R
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.user.User
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody

class cubiListFragment : Fragment() {
    private lateinit var user: User
    private var studentId: Int? = null
    private lateinit var apiRequest: ApiRequest

    data class Cubiculo(
        val id: Int,
        val nombre: String,
        val capacidad: Int,
        val minutosMaximo: Int,
        val estado: String,
        val servicios: List<String>
    )
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        user = User.getInstance(requireContext())
        studentId = user.getStudentId()
        apiRequest=ApiRequest.getInstance(requireContext())
        return inflater.inflate(R.layout.fragment_cubi_list, container, false)

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val listViewCubiculo: ListView = view.findViewById(R.id.listaCubiculos)
        val elementos: MutableList<String> = mutableListOf()
        viewLifecycleOwner.lifecycleScope.launch{
            withContext(Dispatchers.IO){
                val url = "https://appbibliotec.azurewebsites.net/api/cubiculo/cubiculos"
                val (responseStatus, responseString) = apiRequest.getRequest(url)
                if (responseStatus) {
                    val cubiculoType = object : TypeToken<List<Cubiculo>>() {}.type
                    val cubiculos: List<Cubiculo> = Gson().fromJson(responseString, cubiculoType)
                    for (cubic in cubiculos) {
                        var elemento = " ${cubic.nombre} - ${cubic.id} \n Capacidad: ${cubic.capacidad} \n Tiempo máximo: ${cubic.minutosMaximo} \n Servicios:"
                        if (cubic.servicios.isEmpty()) {
                            elemento += "Sin servicios especiales"
                        } else {
                            for (servicio in cubic.servicios){
                                elemento += "\n   - " + servicio
                            }
                        }
                        elemento += "\n\n"
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

                            val cubic = cubiculos[position]
                            itemText.text = elementos[position]

                            // Acciones al hacer clic en el botón Confirmar
                            buttonEditar.setOnClickListener {
                                val bundle = Bundle()
                                bundle.putInt("id",cubic.id)
                                view.findNavController().navigate(R.id.action_cubiListFragment_to_ModifyRoomFragment, bundle)
                            }

                            buttonReservas.setOnClickListener {
                                val bundle = Bundle()
                                bundle.putInt("id",cubic.id)
                                view.findNavController().navigate(R.id.action_roomList_to_bookingList, bundle)
                            }


                            return view
                        }
                    }
                    withContext(Dispatchers.Main) {
                        listViewCubiculo.adapter = adapter
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
}