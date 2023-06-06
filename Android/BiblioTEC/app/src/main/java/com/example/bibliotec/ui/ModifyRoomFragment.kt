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
import android.widget.CheckBox
import android.widget.EditText
import android.widget.Spinner
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.bibliotec.R
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.data.CheckboxListItem
import com.example.bibliotec.databinding.FragmentModifyRoomBinding
import com.example.bibliotec.user.User
import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody


class ModifyRoomFragment : Fragment() {
    private var _binding: FragmentModifyRoomBinding? = null
    private lateinit var apiRequest: ApiRequest
    private val binding get() = _binding!!
    private lateinit var recyclerView: RecyclerView
    private val gson = Gson()
    private lateinit var user: User
    private lateinit var checkBoxItemList: List<CheckboxListItem>
    private var detailsLoaded = false
    private var statusesLoaded = false
    private var selectedStatus: String? = null
    private var spinnerReady = false
    private lateinit var estadosString: List<String>
    private var roomId: Int = -1
    private var oldStatus: String? = null
    private var errorOccurred = false

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {

        apiRequest = ApiRequest.getInstance(requireContext())
        _binding = FragmentModifyRoomBinding.inflate(inflater, container, false)
        user = User.getInstance(requireContext())

        // Parámetros del fragmento
        arguments?.let {
            roomId = it.getInt("id", -1)
        }

        // Si no se brindó un número de cubículo, se devuelve
        if (roomId == -1) {
            findNavController().navigateUp()
        }

        return binding.root

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Elementos
        val idBox = view.findViewById<EditText>(R.id.id_edit)
        val editNameBox = view.findViewById<EditText>(R.id.name_edit)
        val capacityBox = view.findViewById<EditText>(R.id.capacity_edit)
        val maxTimeBox = view.findViewById<EditText>(R.id.max_time_edit)
        val spinner = view.findViewById<Spinner>(R.id.status_spinner)
        val notifyUsers = view.findViewById<CheckBox>(R.id.notify_users)
        val cancelBookings = view.findViewById<CheckBox>(R.id.cancel_current_bookings)

        // Se agrega el listener al botón "Buscar"
        val buscarButton = view.findViewById<Button>(R.id.btnModificar)
        buscarButton.setOnClickListener {
            // Validaciones
            var fieldsOk = true
            var message = ""
            var capacity = 1
            var maxTime = 1

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
                val serviceArray = JsonArray()
                checkBoxItemList.forEach {
                    val jsonObject = JsonObject()
                    jsonObject.addProperty("nombre", it.text)
                    jsonObject.addProperty("activo", it.isChecked)
                    serviceArray.add(jsonObject)
                }

                // Se abre un popup de "Cargando"
                val progressDialog = ProgressDialog(requireContext())
                progressDialog.setMessage("Cargando...")
                progressDialog.setCancelable(false)
                progressDialog.show()

                GlobalScope.launch(Dispatchers.IO) {
                    val url = "https://appbibliotec.azurewebsites.net/api/cubiculo/"

                    val requestBody =
                        ("{\"idCubiculo\": \"${roomId}\"," +
                                "\"nombre\":\"${editNameBox.text}\"," +
                                "\"estado\":\"${selectedStatus}\"," +
                                "\"capacidad\":\"${capacity}\"," +
                                "\"cancelarReservas\":${cancelBookings.isChecked}," +
                                "\"notificarUsuarios\":${notifyUsers.isChecked}," +
                                "\"minutosMaximo\":\"${maxTime}\"," +
                                "\"servicios\":$serviceArray}").toRequestBody(
                            "application/json".toMediaTypeOrNull()
                        )

                    val (responseStatus, responseString) = apiRequest.putRequest(url, requestBody)

                    progressDialog.dismiss()

                    if (responseStatus) {
                        requireActivity().runOnUiThread {
                            AlertDialog.Builder(requireContext())
                                .setTitle("Éxito")
                                .setMessage("Cubículo modificado exitosamente")
                                .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                                .show()
                            findNavController().navigateUp()
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
        }

        // Se debe cargar la lista de estados y la información del cubículo
        recyclerView = view.findViewById(R.id.service_recycler)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())

        // Se abre un popup de "Cargando"
        val progressDialog = ProgressDialog(requireContext())
        progressDialog.setMessage("Cargando...")
        progressDialog.setCancelable(false)
        progressDialog.show()

        GlobalScope.launch(Dispatchers.IO) {
            val url = "https://appbibliotec.azurewebsites.net/api/cubiculo?id=${roomId}"

            val (responseStatus, responseString) = apiRequest.getRequest(url)

            // Se quita el popup de "Cargando"
            detailsLoaded = true
            if (statusesLoaded) {
                progressDialog.dismiss()
            }

            if (responseStatus) {
                val json = gson.fromJson(responseString, JsonArray::class.java)
                val valores = json[0].asJsonObject

                val nombre = valores.get("nombre").asString
                val capacidad = valores.get("capacidad").asInt
                val estado = valores.get("estado").asString
                oldStatus = estado
                val minutosMaximo = valores.get("minutosMaximo").asInt
                val reservas = valores.get("reservas").asInt

                val serviciosList = valores.get("servicios").asJsonArray
                checkBoxItemList = serviciosList.map {
                    CheckboxListItem(
                        it.asJsonObject.get("nombre").asString,
                        it.asJsonObject.get("activo").asBoolean
                    )
                }

                requireActivity().runOnUiThread {
                    idBox.setText("${roomId} ${getString(R.string.modify_room_id)}")
                    editNameBox.setText(nombre)
                    capacityBox.setText("$capacidad")
                    maxTimeBox.setText("$minutosMaximo")

                    if (reservas == 0) {
                        notifyUsers.isEnabled = false
                        cancelBookings.isEnabled = false

                        cancelBookings.text = "${getString(R.string.cancel_bookings_label)} (no hay)"
                    } else {
                        notifyUsers.isEnabled = true
                        cancelBookings.isEnabled = true

                        cancelBookings.text = "${getString(R.string.cancel_bookings_label)} (total: $reservas)"
                    }

                    if (spinnerReady) {
                        try {
                            spinner.setSelection(estadosString.indexOf(oldStatus))
                        } catch (e: Exception) {
                            spinner.setSelection(0)
                        }
                    }

                    val adapter = FilterAdapter(checkBoxItemList)
                    recyclerView.adapter = adapter
                }
            } else {
                if (!errorOccurred) {
                    // Si más de un request da un error, solo se muestra una vez
                    errorOccurred = true
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

        // Se obtienen los estados

        GlobalScope.launch(Dispatchers.IO) {
            val url = "https://appbibliotec.azurewebsites.net/api/cubiculo/estados"

            val (responseStatus, responseString) = apiRequest.getRequest(url)

            // Se quita el popup de "Cargando"
            statusesLoaded = true
            if (detailsLoaded) {
                progressDialog.dismiss()
            }

            if (responseStatus) {
                val json = gson.fromJson(responseString, JsonObject::class.java)
                val estadosList = json.get("estados").asJsonArray
                estadosString = estadosList.map { it.asString }
                selectedStatus = estadosString[0]


                requireActivity().runOnUiThread {
                    val adapter = ArrayAdapter(
                        requireContext(),
                        android.R.layout.simple_spinner_item,
                        estadosString
                    )
                    adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)

                    spinner.adapter = adapter
                    spinnerReady = true

                    if (!oldStatus.isNullOrEmpty()) {
                        try {
                            spinner.setSelection(estadosString.indexOf(oldStatus))
                        } catch (e: Exception) {
                            spinner.setSelection(0)
                        }
                    }

                    spinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                        override fun onItemSelected(
                            parent: AdapterView<*>,
                            view: View?,
                            position: Int,
                            id: Long
                        ) {
                            selectedStatus = estadosString[position]
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
                if (!errorOccurred) {
                    // Si más de un request da un error, solo se muestra una vez
                    errorOccurred = true
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
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

}