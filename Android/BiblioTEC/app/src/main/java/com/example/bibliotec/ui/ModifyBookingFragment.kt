package com.example.bibliotec.ui

import android.app.AlertDialog
import android.app.DatePickerDialog
import android.app.ProgressDialog
import android.app.TimePickerDialog
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
import androidx.navigation.findNavController
import androidx.navigation.fragment.findNavController
import com.example.bibliotec.R
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.databinding.FragmentModifyBookingBinding
import com.example.bibliotec.misc.LocalDate
import com.example.bibliotec.user.User
import com.google.gson.Gson
import com.google.gson.JsonArray
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.Calendar

class ModifyBookingFragment : Fragment() {
    private var _binding: FragmentModifyBookingBinding? = null
    private lateinit var apiRequest: ApiRequest
    private val binding get() = _binding!!
    private val gson = Gson()
    private lateinit var user: User
    private var detailsLoaded = false
    private var studentsLoaded = false
    private var roomsLoaded = false
    private var studentsReady = false
    private var roomsReady = false
    private val statusString = mutableListOf("Activa", "Confirmada", "Inactiva")
    private var bookingId: Int = -1
    private var oldRoom: Int? = null
    private var selectedRoom: Int? = null
    private var oldStudent: Int? = null
    private var selectedStudent: Int? = null
    private var oldStatus: Int? = null
    private var selectedStatus: Int? = null
    private var errorOccurred = false
    private val studentList = mutableListOf<Int>()
    private val roomList = mutableListOf<Int>()
    private var startCalendar = Calendar.getInstance()
    private var endCalendar = Calendar.getInstance()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {

        apiRequest = ApiRequest.getInstance(requireContext())
        _binding = FragmentModifyBookingBinding.inflate(inflater, container, false)
        user = User.getInstance(requireContext())

        // Parámetros del fragmento
        arguments?.let {
            bookingId = it.getInt("id", -1)
        }

        // Si no se brindó un número de reserva, se devuelve
        if (bookingId == -1) {
            findNavController().navigateUp()
        }

        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Elementos
        val idBox = view.findViewById<EditText>(R.id.id_edit)
        val dateBox = view.findViewById<EditText>(R.id.date_edit)
        val roomSpinner = view.findViewById<Spinner>(R.id.room_spinner)
        val studentSpinner = view.findViewById<Spinner>(R.id.student_spinner)
        val bookedDateBox = view.findViewById<EditText>(R.id.booked_date)
        val startTimeBox = view.findViewById<EditText>(R.id.start_time)
        val endTimeBox = view.findViewById<EditText>(R.id.end_time)
        val statusSpinner = view.findViewById<Spinner>(R.id.status_spinner)
        val submitButton = view.findViewById<Button>(R.id.btnModificar)
        val deleteButton = view.findViewById<Button>(R.id.btnEliminar)

        // Se agregan los listeners a la fecha y a las horas
        bookedDateBox.setOnClickListener {
            onClickDateFilter(view)
        }

        startTimeBox.setOnClickListener {
            onClickTimeFilter(view, true)
        }

        endTimeBox.setOnClickListener {
            onClickTimeFilter(view, false)
        }

        // Listener para el botón
        submitButton.setOnClickListener {
            // Validaciones
            val currentCalendar = Calendar.getInstance()
            var filtersOk = true
            var message = ""

            if (bookedDateBox.text.toString().isEmpty()) {
                filtersOk = false
                message = "La fecha reservada no debe estar vacía"
            } else if (startTimeBox.text.toString().isEmpty()) {
                filtersOk = false
                message = "La hora de inicio de la reserva no debe estar vacía"
            } else if (endTimeBox.text.toString().isEmpty()) {
                filtersOk = false
                message = "La hora de salida de la reserva no debe estar vacía"
            } else if (startCalendar >= endCalendar) {
                filtersOk = false
                message = "La hora de salida debe ser mayor que la hora de inicio"
            } else if (startCalendar < currentCalendar) {
                filtersOk = false
                message = "La hora de inicio no puede ser anterior a la hora actual"
            }

            if (!filtersOk) {
                AlertDialog.Builder(requireContext())
                    .setTitle("Datos inválidos")
                    .setMessage(message)
                    .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                    .show()
            } else {
                val progressDialog = ProgressDialog(requireContext())
                progressDialog.setMessage("Cargando...")
                progressDialog.setCancelable(false)
                progressDialog.show()

                GlobalScope.launch(Dispatchers.IO) {
                    val url = "https://appbibliotec.azurewebsites.net/api/reserva"
                    val requestBody =
                        ("{\"id\": \"$bookingId\"," +
                                "\"idCubiculo\": $selectedRoom," +
                                "\"idEstudiante\": $selectedStudent," +
                                "\"horaInicio\": \"${LocalDate.toUtc(startCalendar)}\"," +
                                "\"horaFin\": \"${LocalDate.toUtc(endCalendar)}\"," +
                                "\"activo\": ${selectedStatus!! < 2}," +
                                "\"confirmado\": ${selectedStatus!! == 1}}").toRequestBody("application/json".toMediaTypeOrNull())

                    val (responseStatus, responseString) = apiRequest.putRequest(url, requestBody)

                    progressDialog.dismiss()

                    if (responseStatus) {
                        requireActivity().runOnUiThread {
                            AlertDialog.Builder(requireContext())
                                .setTitle("Éxito")
                                .setMessage("Reserva modificada exitosamente")
                                .setPositiveButton("OK") { dialog, _ ->
                                    dialog.dismiss()
                                    findNavController().navigateUp()
                                }
                                .show()
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

        // Se agrega un listener para el botón de eliminar
        deleteButton.setOnClickListener {
            // Confirmación
            AlertDialog.Builder(requireContext())
                .setTitle("Confirmación")
                .setMessage("Está a punto de eliminar la reserva actual. ¿Desea continuar?")
                .setPositiveButton("OK") { dialog, which ->
                    // Se abre un popup de "Cargando"
                    val progressDialog = ProgressDialog(requireContext())
                    progressDialog.setMessage("Cargando...")
                    progressDialog.setCancelable(false)
                    progressDialog.show()

                    GlobalScope.launch(Dispatchers.IO) {
                        val url = "https://appbibliotec.azurewebsites.net/api/reserva/eliminar?id=${bookingId}"
                        val emptyRequestBody = "".toRequestBody("application/json".toMediaType())

                        val (responseStatus, responseString) = apiRequest.putRequest(url, emptyRequestBody)

                        progressDialog.dismiss()

                        if (responseStatus) {
                            requireActivity().runOnUiThread {
                                AlertDialog.Builder(requireContext())
                                    .setTitle("Éxito")
                                    .setMessage("Reserva eliminada exitosamente")
                                    .setPositiveButton("OK") { dialog, _ ->
                                        dialog.dismiss()
                                        findNavController().navigateUp()
                                    }
                                    .show()
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
                .setNegativeButton("Cancelar") { dialog, which -> }
                .show()
        }

        // Se abre un popup de "Cargando"
        val progressDialog = ProgressDialog(requireContext())
        progressDialog.setMessage("Cargando...")
        progressDialog.setCancelable(false)
        progressDialog.show()

        GlobalScope.launch(Dispatchers.IO) {
            val url = "https://appbibliotec.azurewebsites.net/api/reserva?idReserva=${bookingId}"

            val (responseStatus, responseString) = apiRequest.getRequest(url)

            // Se quita el popup de "Cargando"
            detailsLoaded = true
            if (studentsLoaded && roomsLoaded) {
                progressDialog.dismiss()
            }

            if (responseStatus) {
                val json = gson.fromJson(responseString, JsonArray::class.java)
                val valores = json[0].asJsonObject

                startCalendar.time = LocalDate.parseIso(valores.get("horaInicio").asString)
                endCalendar.time = LocalDate.parseIso(valores.get("horaFin").asString)

                oldStatus = if (valores.get("activo").asBoolean) {
                    // La reserva está activa
                    if (valores.get("confirmado").asBoolean) 1 // Activa, confirmada
                    else 0 // Activa, sin confirmar
                } else {
                    2 // Inactiva
                }

                requireActivity().runOnUiThread {
                    idBox.setText("$bookingId ${getString(R.string.modify_room_id)}")
                    dateBox.setText(
                        LocalDate.dateTime(
                            valores.get("fecha").asString,
                            isIso = true,
                            includeSeconds = true,
                            fullDate = true
                        )
                    )
                    bookedDateBox.setText(
                        LocalDate.date(
                            valores.get("horaInicio").asString,
                            true,
                            fullDate = true
                        )
                    )

                    startTimeBox.setText(LocalDate.time(startCalendar.time))
                    endTimeBox.setText(LocalDate.time(endCalendar.time))

                    val adapter = ArrayAdapter(
                        requireContext(),
                        android.R.layout.simple_spinner_item,
                        statusString
                    )
                    adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                    statusSpinner.adapter = adapter

                    oldRoom = valores.get("idCubiculo").asInt
                    if (roomsReady) {
                        try {
                            roomSpinner.setSelection(roomList.indexOf(oldRoom))
                        } catch (e: Exception) {
                            roomSpinner.setSelection(0)
                        }
                    }

                    oldStudent = valores.get("idEstudiante").asInt
                    if (studentsReady) {
                        try {
                            studentSpinner.setSelection(studentList.indexOf(oldStudent))
                        } catch (e: Exception) {
                            studentSpinner.setSelection(0)
                        }
                    }

                    statusSpinner.onItemSelectedListener =
                        object : AdapterView.OnItemSelectedListener {
                            override fun onItemSelected(
                                parent: AdapterView<*>,
                                view: View?,
                                position: Int,
                                id: Long
                            ) {
                                selectedStatus = position
                            }

                            override fun onNothingSelected(parent: AdapterView<*>) {
                                AlertDialog.Builder(requireContext())
                                    .setTitle("Datos inválidos")
                                    .setMessage("Debe seleccionar un estado")
                                    .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                                    .show()
                            }
                        }

                    try {
                        statusSpinner.setSelection(oldStatus!!)
                    } catch (e: Exception) {
                        statusSpinner.setSelection(0)
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

        // Se cargan los cubículos
        GlobalScope.launch(Dispatchers.IO) {
            val url = "https://appbibliotec.azurewebsites.net/api/cubiculo/cubiculos?soloNombre=1"

            val (responseStatus, responseString) = apiRequest.getRequest(url)

            // Se quita el popup de "Cargando"
            roomsLoaded = true
            if (studentsLoaded && detailsLoaded) {
                progressDialog.dismiss()
            }

            if (responseStatus) {
                val json = gson.fromJson(responseString, JsonArray::class.java)
                val roomListString = mutableListOf<String>()
                json.forEach {
                    // Se agregan los elementos al hashMap
                    val asObject = it.asJsonObject
                    val id = asObject.get("id").asInt
                    val nombre = asObject.get("nombre").asString
                    roomList.add(id)
                    roomListString.add("$id: $nombre")
                }

                requireActivity().runOnUiThread {
                    val adapter = ArrayAdapter(
                        requireContext(),
                        android.R.layout.simple_spinner_item,
                        roomListString
                    )
                    adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)

                    roomSpinner.adapter = adapter
                    roomsReady = true

                    if (oldRoom != null) {
                        try {
                            roomSpinner.setSelection(roomList.indexOf(oldRoom))
                        } catch (e: Exception) {
                            roomSpinner.setSelection(0)
                        }
                    }

                    roomSpinner.onItemSelectedListener =
                        object : AdapterView.OnItemSelectedListener {
                            override fun onItemSelected(
                                parent: AdapterView<*>,
                                view: View?,
                                position: Int,
                                id: Long
                            ) {
                                selectedRoom = roomList[position]
                            }

                            override fun onNothingSelected(parent: AdapterView<*>) {
                                AlertDialog.Builder(requireContext())
                                    .setTitle("Datos inválidos")
                                    .setMessage("Debe seleccionar un cubículo")
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

        // Se cargan los estudiantes
        GlobalScope.launch(Dispatchers.IO) {
            val url =
                "https://appbibliotec.azurewebsites.net/api/estudiante/estudiantes?soloNombre=1"

            val (responseStatus, responseString) = apiRequest.getRequest(url)

            // Se quita el popup de "Cargando"
            studentsLoaded = true
            if (roomsLoaded && detailsLoaded) {
                progressDialog.dismiss()
            }

            if (responseStatus) {
                val json = gson.fromJson(responseString, JsonArray::class.java)
                val studentListString = mutableListOf<String>()
                json.forEach {
                    // Se agregan los elementos al hashMap
                    val asObject = it.asJsonObject
                    val id = asObject.get("id").asInt
                    val nombre = asObject.get("Nombre").asString
                    studentList.add(id)
                    studentListString.add("$id: $nombre")
                }

                requireActivity().runOnUiThread {
                    val adapter = ArrayAdapter(
                        requireContext(),
                        android.R.layout.simple_spinner_item,
                        studentListString
                    )
                    adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)

                    studentSpinner.adapter = adapter
                    studentsReady = true

                    if (oldStudent != null) {
                        try {
                            studentSpinner.setSelection(studentList.indexOf(oldStudent))
                        } catch (e: Exception) {
                            studentSpinner.setSelection(0)
                        }
                    }

                    studentSpinner.onItemSelectedListener =
                        object : AdapterView.OnItemSelectedListener {
                            override fun onItemSelected(
                                parent: AdapterView<*>,
                                view: View?,
                                position: Int,
                                id: Long
                            ) {
                                selectedStudent = studentList[position]
                            }

                            override fun onNothingSelected(parent: AdapterView<*>) {
                                AlertDialog.Builder(requireContext())
                                    .setTitle("Datos inválidos")
                                    .setMessage("Debe seleccionar un estudiante")
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

    private fun onClickDateFilter(view: View) {
        val bookedDateBox = view.findViewById<EditText>(R.id.booked_date)

        val year = startCalendar.get(Calendar.YEAR)
        val month = startCalendar.get(Calendar.MONTH)
        val day = startCalendar.get(Calendar.DAY_OF_MONTH)

        val listener = DatePickerDialog.OnDateSetListener { _, y, m, d ->
            val currentCalendar = Calendar.getInstance()
            val currYear = currentCalendar.get(Calendar.YEAR)
            val currMonth = currentCalendar.get(Calendar.MONTH)
            val currDay = currentCalendar.get(Calendar.DAY_OF_MONTH)

            if (y < currYear || (y == currYear && m < currMonth) || (y == currYear && m == currMonth && d < currDay)) {
                AlertDialog.Builder(requireContext())
                    .setTitle("Datos inválidos")
                    .setMessage("No puede ingresar una fecha pasada")
                    .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                    .show()
            } else {
                startCalendar.set(y, m, d)
                endCalendar.set(y, m, d)

                bookedDateBox.setText(LocalDate.date(startCalendar.time, fullDate = true))
            }
        }

        DatePickerDialog(requireContext(), listener, year, month, day).show()
    }

    private fun onClickTimeFilter(view: View, isStart: Boolean) {
        val timeBox = if (isStart) {
            view.findViewById<EditText>(R.id.start_time)
        } else {
            view.findViewById<EditText>(R.id.end_time)
        }

        var hour = if (isStart) {
            startCalendar.get(Calendar.HOUR_OF_DAY)
        } else {
            endCalendar.get(Calendar.HOUR_OF_DAY)
        }

        var minute = if (isStart) {
            startCalendar.get(Calendar.MINUTE)
        } else {
            endCalendar.get(Calendar.MINUTE)
        }

        val listener = TimePickerDialog.OnTimeSetListener { _, h, m ->
            if (isStart) {
                startCalendar.set(Calendar.HOUR_OF_DAY, h)
                startCalendar.set(Calendar.MINUTE, m)
                timeBox.setText(LocalDate.time(startCalendar.time))
            } else {
                endCalendar.set(Calendar.HOUR_OF_DAY, h)
                endCalendar.set(Calendar.MINUTE, m)
                timeBox.setText(LocalDate.time(endCalendar.time))

                // Para evitar problemas si la instancia se creó para días diferentes
                // (por ejemplo, si la aplicación se abrió casi a medianoche)
                endCalendar.set(
                    startCalendar.get(Calendar.YEAR),
                    startCalendar.get(Calendar.MONTH),
                    startCalendar.get(Calendar.DAY_OF_MONTH)
                )
            }
        }

        TimePickerDialog(requireContext(), listener, hour, minute, false).show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}