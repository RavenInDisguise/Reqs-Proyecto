package com.example.bibliotec.ui

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.bibliotec.R
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.data.RoomItem
import com.example.bibliotec.databinding.FragmentAvailableRoomsBinding
import com.example.bibliotec.user.User
import com.google.gson.Gson
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
    private lateinit var servicios: Array<String>
    private var capacidad: Int = 1
    private val elementsPerPage = 15
    private lateinit var roomItemList: MutableList<RoomItem>
    private lateinit var completeRoomItemList: List<RoomItem>

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAvailableRoomsBinding.inflate(inflater, container, false)
        apiRequest = ApiRequest.getInstance(requireContext())
        user = User.getInstance(requireContext())

        // Parámetros del fragmento
        arguments?.let {
            horaInicio = it.getString("horaInicio")!!
            horaFin = it.getString("horaFin")!!
            servicios = it.getStringArray("servicios")!!
            capacidad = it.getInt("capacidad")
        }

        roomItemList = mutableListOf()
        completeRoomItemList = listOf()

        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Se debe cargar la lista de servicios
        recyclerView = view.findViewById(R.id.available_rooms_recycler)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())
        val adapter = AvailableRoomAdapter(roomItemList, horaInicio, horaFin)
        recyclerView.adapter = adapter

        // Se agrega un listener para agregar elementos a la lista al hacer scroll al final
        val progress = view.findViewById<ProgressBar>(R.id.progressBar)
        progress.visibility = View.VISIBLE

        recyclerView.addOnScrollListener(object : RecyclerView.OnScrollListener() {
            override fun onScrollStateChanged(recyclerView: RecyclerView, newState: Int) {
                super.onScrollStateChanged(recyclerView, newState)
                if (newState == RecyclerView.SCROLL_STATE_IDLE) {
                    val layoutManager = recyclerView.layoutManager as LinearLayoutManager
                    val lastVisibleItemPosition = layoutManager.findLastVisibleItemPosition()
                    val totalItemCount = layoutManager.itemCount

                    if (roomItemList.isNotEmpty() && lastVisibleItemPosition == totalItemCount - 1 && completeRoomItemList.size > roomItemList.size) {
                        // Se cargan más elementos
                        val endIndex =
                            (totalItemCount + elementsPerPage).coerceAtMost(completeRoomItemList.size)

                        roomItemList.addAll(completeRoomItemList.subList(totalItemCount, endIndex))
                        adapter.notifyItemRangeInserted(totalItemCount, endIndex)

                        if (completeRoomItemList.size <= roomItemList.size) {
                            progress.visibility = View.GONE
                        }
                    }
                }
            }
        })

        GlobalScope.launch(Dispatchers.IO) {
            val url =
                "https://appbibliotec.azurewebsites.net/api/cubiculo/disponibles?horaInicio=${horaInicio}&${horaFin}"

            val (responseStatus, responseString) = apiRequest.getRequest(url)

            if (responseStatus) {
                val roomList = gson.fromJson(responseString, Array<RoomItem>::class.java).toList()
                completeRoomItemList = roomList.filter { room ->
                    servicios.all { service ->
                        room.servicios.contains(service)
                    } && room.capacidad >= capacidad
                }
                if (completeRoomItemList.isNullOrEmpty()) {
                    val message = if (roomList.isNullOrEmpty()) {
                        "No se encontraron cubículos disponibles en el horario seleccionado"
                    } else {
                        "Ninguno de los cubículos disponibles en el horario seleccionado cumplen con los criterios de servicios o capacidad mínimos"
                    }
                    requireActivity().runOnUiThread {
                        AlertDialog.Builder(requireContext())
                            .setTitle("Sin resultados")
                            .setMessage(message)
                            .setPositiveButton("OK") { dialog, _ ->
                                dialog.dismiss()
                                findNavController().navigateUp()
                            }
                            .show()
                    }
                } else {
                    val endIndex = elementsPerPage.coerceAtMost(completeRoomItemList.size)
                    roomItemList.addAll(completeRoomItemList.subList(0, endIndex))

                    requireActivity().runOnUiThread {
                        adapter.notifyItemRangeInserted(0, endIndex)

                        if (endIndex == completeRoomItemList.size) {
                            progress.visibility = View.GONE
                        }
                    }
                }
            } else {
                if (user.isLoggedIn()) {
                    // Ocurrió un error al hacer la consulta
                    requireActivity().runOnUiThread {
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
                    requireActivity().runOnUiThread {
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