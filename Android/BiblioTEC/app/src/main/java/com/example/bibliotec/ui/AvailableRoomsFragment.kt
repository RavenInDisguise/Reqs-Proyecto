package com.example.bibliotec.ui

import android.app.AlertDialog
import android.app.ProgressDialog
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.bibliotec.R
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.data.RoomItem
import com.example.bibliotec.databinding.FragmentAvailableRoomsBinding
import com.example.bibliotec.user.User
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

class AvailableRoomsFragment : Fragment() {
    private var _binding: FragmentAvailableRoomsBinding? = null
    private val binding get() = _binding!!
    private lateinit var apiRequest: ApiRequest
    private lateinit var user: User
    private val gson = Gson()
    private lateinit var recyclerView: RecyclerView

    private lateinit var horaInicio: String
    private lateinit var horaFin: String
    private lateinit var servicios : Array<String>
    private var capacidad : Int = 1

    private lateinit var roomItemList : List<RoomItem>

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentAvailableRoomsBinding.inflate(inflater, container, false)
        apiRequest = ApiRequest.getInstance(requireContext())

        // Parámetros del fragmento
        arguments?.let {
            horaInicio = it.getString("horaInicio")!!
            horaFin = it.getString("horaFin")!!
            servicios = it.getStringArray("servicios")!!
            capacidad = it.getInt("capacidad")!!
        }

        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Se debe cargar la lista de servicios
        recyclerView = view.findViewById(R.id.available_rooms_recycler)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())

        // Se intenta cargar la información desde el servidor
        val progressDialog = ProgressDialog(requireContext())
        progressDialog.setMessage("Buscando cubículos disponibles...")
        progressDialog.setCancelable(false)
        progressDialog.show()

        GlobalScope.launch(Dispatchers.IO) {
            val url = "https://appbibliotec.azurewebsites.net/api/cubiculo/disponibles?horaInicio=${horaInicio}&${horaFin}"

            val (responseStatus, responseString) = apiRequest.getRequest(url)

            // Se quita el popup de "Cargando"
            progressDialog.dismiss()

            if (responseStatus) {
                val roomList = gson.fromJson(responseString, Array<RoomItem>::class.java).toList()
                roomItemList = roomList.filter { room ->
                    servicios.all { service ->
                        room.servicios.contains(service)
                    } && room.capacidad >= capacidad
                }
                if (roomItemList.isNullOrEmpty()) {
                    val message = if (roomList.isNullOrEmpty()) {
                        "No se encontraron cubículos disponibles en el horario seleccionado"
                    } else {
                        "Ninguno de los cubículos disponibles en el horario seleccionado cumplen con los criterios de servicios o capacidad mínimos"
                    }
                    requireActivity().runOnUiThread() {
                        AlertDialog.Builder(requireContext())
                            .setTitle("Sin resultados")
                            .setMessage(message)
                            .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                            .show()
                        findNavController().navigateUp()
                    }
                } else {
                    requireActivity().runOnUiThread() {
                        val adapter = AvailableRoomAdapter(roomItemList)
                        recyclerView.adapter = adapter
                    }
                }
            } else {
                if (user.isLoggedIn()) {
                    // Ocurrió un error al hacer la consulta
                    requireActivity().runOnUiThread() {
                        AlertDialog.Builder(requireContext())
                            .setTitle("Error")
                            .setMessage(responseString)
                            .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                            .show()
                        findNavController().navigateUp()
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

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}