package com.example.bibliotec.ui

import android.app.AlertDialog
import android.app.ProgressDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.Spinner
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.bibliotec.R
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.data.CheckboxListItem
import com.example.bibliotec.databinding.FragmentNewRoomBinding
import com.example.bibliotec.user.User
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.TimeZone


class NewRoomFragment : Fragment() {
    private var _binding: FragmentNewRoomBinding? = null
    private lateinit var apiRequest: ApiRequest
    private val binding get() = _binding!!
    private lateinit var recyclerView: RecyclerView
    private val gson = Gson()
    private lateinit var user: User
    private lateinit var checkBoxItemList: List<CheckboxListItem>
    private var servicesLoaded = false
    private var statusesLoaded = false
    private var selectedStatus: String? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {

        apiRequest = ApiRequest.getInstance(requireContext())
        _binding = FragmentNewRoomBinding.inflate(inflater, container, false)
        user = User.getInstance(requireContext())
        return binding.root

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Se agrega el listener al botón "Buscar"
        val buscarButton = view.findViewById<Button>(R.id.btnAgregar)
        buscarButton.setOnClickListener {
            // Validaciones
            var fieldsOk = true
            var message = ""
            var capacity = 1
            var maxTime = 1

            // Elementos
            val editNameBox = view.findViewById<EditText>(R.id.name_edit)
            val capacityBox = view.findViewById<EditText>(R.id.capacity_edit)
            val maxTimeBox = view.findViewById<EditText>(R.id.max_time_edit)

            var currentCalendar = Calendar.getInstance()

            if (editNameBox.text.toString().isEmpty()) {
                fieldsOk = false
                message = "El nombre no debe estar vacío"
            } else if (capacityBox.text.toString().isEmpty()) {
                fieldsOk = false
                message = "La capacidad no debe estar vacía"
            } else if (maxTimeBox.text.toString().isEmpty()) {
                fieldsOk = false
                message = "El tiempo máximo no debe estar vacío"
            } else {
                try {
                    capacity = capacityBox.text.toString().toInt()
                    if (capacity < 1) {
                        fieldsOk = false
                        message = "La capacidad no puede ser menor a 1"
                    }
                } catch (e: Exception) {
                    fieldsOk = false
                    message = "La capacidad debe ser un valor numérico"
                }

                try {
                    maxTime = maxTimeBox.text.toString().toInt()
                    if (maxTime < 0) {
                        fieldsOk = false
                        message = "El tiempo no puede ser cero"
                    }
                } catch (e: Exception) {
                    fieldsOk = false
                    message = "El tiempo debe ser un valor numérico"
                }
            }

            if (!fieldsOk) {
                AlertDialog.Builder(requireContext())
                    .setTitle("Datos inválidos")
                    .setMessage(message)
                    .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                    .show()
            } else {
                val services = checkBoxItemList.filter { it.isChecked }
                    .map { it.text }.toTypedArray()

                GlobalScope.launch(Dispatchers.IO) {
                    val url = "https://appbibliotec.azurewebsites.net/api/cubiculo/crear"

                    val requestBody =
                        ("{\"estadoActual\": \"${selectedStatus}\"," +
                                "\"nombre\":\"${editNameBox.text}\"," +
                                "\"capacidad\":\"${capacity}\"," +
                                "\"tiempoMaximo\":\"${maxTime}\"," +
                                "\"servicios\":${services.map { "\"" + it + "\"" }}}").toRequestBody("application/json".toMediaTypeOrNull())

                    val (responseStatus, responseString) = apiRequest.putRequest(url, requestBody)
                    if (responseStatus) {
                        requireActivity().runOnUiThread() {
                            AlertDialog.Builder(requireContext())
                                .setTitle("Éxito")
                                .setMessage("Cubículo agregado exitosamente")
                                .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                                .show()
                            findNavController().navigateUp()
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
        }

        // Se debe cargar la lista de servicios
        recyclerView = view.findViewById(R.id.service_recycler)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())

        // Se abre un popup de "Cargando"
        val progressDialog = ProgressDialog(requireContext())
        progressDialog.setMessage("Cargando...")
        progressDialog.setCancelable(false)
        progressDialog.show()

        GlobalScope.launch(Dispatchers.IO) {
            val url = "https://appbibliotec.azurewebsites.net/api/cubiculo/servicios"

            val (responseStatus, responseString) = apiRequest.getRequest(url)

            // Se quita el popup de "Cargando"
            servicesLoaded = true
            if (statusesLoaded) {
                progressDialog.dismiss()
            }

            if (responseStatus) {
                val json = gson.fromJson(responseString, JsonObject::class.java)
                val serviciosList = json.get("servicios").asJsonArray
                checkBoxItemList = serviciosList.map { CheckboxListItem(it.asString, false) }
                requireActivity().runOnUiThread() {
                    val adapter = FilterAdapter(checkBoxItemList)
                    recyclerView.adapter = adapter
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

        // Se obtienen los estados

        GlobalScope.launch(Dispatchers.IO) {
            val url = "https://appbibliotec.azurewebsites.net/api/cubiculo/estados"

            val (responseStatus, responseString) = apiRequest.getRequest(url)

            // Se quita el popup de "Cargando"
            statusesLoaded = true
            if (servicesLoaded) {
                progressDialog.dismiss()
            }

            if (responseStatus) {
                val json = gson.fromJson(responseString, JsonObject::class.java)
                val estadosList = json.get("estados").asJsonArray
                val estadosString = estadosList.map { it.asString }
                selectedStatus = estadosString[0]


                requireActivity().runOnUiThread() {
                    val adapter = ArrayAdapter(
                        requireContext(),
                        android.R.layout.simple_spinner_item,
                        estadosString
                    )
                    adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)

                    val spinner = view.findViewById<Spinner>(R.id.status_spinner)
                    spinner.adapter = adapter

                    spinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                        override fun onItemSelected(
                            parent: AdapterView<*>,
                            view: View?,
                            position: Int,
                            id: Long
                        ) {
                            selectedStatus = estadosString[position]
                            println(selectedStatus)
                        }

                        override fun onNothingSelected(parent: AdapterView<*>) {
                            AlertDialog.Builder(requireContext())
                                .setTitle("Datos inválidos")
                                .setMessage("Debe seleccionar un estado")
                                .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                                .show()
                        }
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