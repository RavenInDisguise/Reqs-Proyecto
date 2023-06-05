package com.example.bibliotec.ui

import android.app.AlertDialog
import android.app.ProgressDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.bibliotec.R
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.data.BookingItem
import com.example.bibliotec.data.RoomItem
import com.example.bibliotec.databinding.FragmentAvailableRoomsBinding
import com.example.bibliotec.user.User
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

class BookingListFragment : Fragment() {
    private var _binding: FragmentAvailableRoomsBinding? = null
    private val binding get() = _binding!!
    private lateinit var apiRequest: ApiRequest
    private lateinit var user: User
    private val gson = Gson()
    private lateinit var recyclerView: RecyclerView


    private lateinit var bookingItemList : List<BookingItem>

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentAvailableRoomsBinding.inflate(inflater, container, false)
        apiRequest = ApiRequest.getInstance(requireContext())

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
            val url = "https://appbibliotec.azurewebsites.net/api/reserva/reservas"

            val (responseStatus, responseString) = apiRequest.getRequest(url)

            // Se quita el popup de "Cargando"
            progressDialog.dismiss()

            if (responseStatus) {
                bookingItemList = gson.fromJson(responseString, Array<BookingItem>::class.java).toList()

                if (bookingItemList.isNullOrEmpty()) {
                    val message = "No hay reservas existentes"
                    requireActivity().runOnUiThread() {
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
                    requireActivity().runOnUiThread() {
                        val adapter = BookingListAdapter(bookingItemList)
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

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}