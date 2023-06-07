package com.example.bibliotec.ui

import android.app.AlertDialog
import android.app.DatePickerDialog
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
import androidx.core.view.isEmpty
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.example.bibliotec.R
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.databinding.FragmentStudentModBinding
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

class StudentModFragment : Fragment() {
    private lateinit var apiRequest: ApiRequest
    private var _binding: FragmentStudentModBinding? = null
    private lateinit var user: User
    private val binding get() = _binding!!
    private var studentId: Int = -1
    private var selectedCalendar = Calendar.getInstance()
    private var detailsLoaded = false
    private var errorOccurred = false
    private val gson = Gson()
    private val statusString = mutableListOf("Activo", "Inactivo")
    private var selectedStatus: Boolean = true

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {

        apiRequest = ApiRequest.getInstance(requireContext())
        _binding = FragmentStudentModBinding.inflate(inflater, container, false)
        user = User.getInstance(requireContext())

        // Parámetros del fragmento
        arguments?.let {
            studentId = it.getInt("id", -1)
        }

        // Si no se brindó un número de reserva, se devuelve
        if (studentId == -1) {
            findNavController().navigateUp()
        }

        return binding.root
    }
/* */
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Elementos
        val idBox = view.findViewById<EditText>(R.id.editEstId)
        val nameBox = view.findViewById<EditText>(R.id.editEstName)
        val firstLNameBox = view.findViewById<EditText>(R.id.editEstFName)
        val secondLNameBox = view.findViewById<EditText>(R.id.editEstSName)
        val cedulaBox = view.findViewById<EditText>(R.id.editEstCedula)
        val carneBox = view.findViewById<EditText>(R.id.editEstCarne)
        val correoBox = view.findViewById<EditText>(R.id.editEstCorreo)
        val bdayBox = view.findViewById<EditText>(R.id.editEstFNacimiento)//calendar
        val claveBox = view.findViewById<EditText>(R.id.editEstClave)
        val submitButton = view.findViewById<Button>(R.id.btnEditStudent)
        val deleteButton = view.findViewById<Button>(R.id.btnEliminar)
        val statusSpinner = view.findViewById<Spinner>(R.id.status_spinner)

        val adapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_item,
            statusString
        )
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        statusSpinner.adapter = adapter

        // Se agregan los listeners a la fecha
        bdayBox.setOnClickListener {
            onClickDateFilter(view)
        }

        // Listener para el botón
        submitButton.setOnClickListener {
            // Validaciones
            val currentCalendar = Calendar.getInstance()
            var filtersOk = true
            var message = ""

            val selectedName = nameBox.text.toString()
            val selectedFName = firstLNameBox.text.toString()
            val selectedSName = secondLNameBox.text.toString()
            val selectedCedula = cedulaBox.text.toString()
            val selectedCarnet = carneBox.text.toString()
            val selectedCorreo = correoBox.text.toString()
            val selectedpassword = claveBox.text.toString()

            if (bdayBox.text.toString().isEmpty()) {
                filtersOk = false
                message = "La fecha de nacimiento no debe estar vacía"
            } else if (selectedCalendar > currentCalendar) {
                filtersOk = false
                message = "La fecha de nacimiento no puede ser futura"
            } else if (selectedName.isEmpty()) {
                filtersOk = false
                message = "El nombre no puede estar vacío"
            } else if (selectedFName.isEmpty()) {
                filtersOk = false
                message = "El primer apellido no puede estar vacío"
            } else if (selectedSName.isEmpty()) {
                filtersOk = false
                message = "El segundo apellido no puede estar vacío"
            } else if (selectedCarnet.isEmpty()) {
                filtersOk = false
                message = "El carné no puede estar vacío"
            } else if (selectedCedula.isEmpty()) {
                filtersOk = false
                message = "La cédula no puede estar vacía"
            } else if (selectedCorreo.isEmpty()) {
                filtersOk = false
                message = "El correo electrónico no puede estar vacío"
            } else if (!isValidEmail(selectedCorreo)) {
                // Se valida que el correo pertenezca a @estudiantec.cr
                filtersOk = false
                message = "El correo electrónico debe pertenecer al dominio @estudiantec.cr"
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
                    val url = "https://appbibliotec.azurewebsites.net/api/estudiante/actualizar"
                    val requestBody =
                        ("{\"idEstudiante\": \"$studentId\"," +
                                "\"nombre\": \"$selectedName\"," +
                                "\"apellido1\": \"$selectedFName\"," +
                                "\"apellido2\": \"$selectedSName\"," +
                                "\"cedula\": $selectedCedula," +
                                "\"carnet\": $selectedCarnet," +
                                "\"fechaNacimiento\": \"${LocalDate.toIso(selectedCalendar)}\"," +
                                "\"correo\": \"$selectedCorreo\"," +
                                "\"clave\": \"$selectedpassword\"," +
                                "\"activo\": $selectedStatus}").toRequestBody("application/json".toMediaTypeOrNull())

                    val (responseStatus, responseString) = apiRequest.putRequest(url, requestBody)

                    progressDialog.dismiss()

                    if (responseStatus) {
                        requireActivity().runOnUiThread {
                            AlertDialog.Builder(requireContext())
                                .setTitle("Éxito")
                                .setMessage("Estudiante modificado exitosamente")
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
            .setMessage("Está a punto de eliminar el estudiante actual. ¿Desea continuar?")
            .setPositiveButton("OK") { dialog, which ->
                // Se abre un popup de "Cargando"
                val progressDialog = ProgressDialog(requireContext())
                progressDialog.setMessage("Cargando...")
                progressDialog.setCancelable(false)
                progressDialog.show()

                GlobalScope.launch(Dispatchers.IO) {
                    val url = "https://appbibliotec.azurewebsites.net/api/estudiante/eliminar?id=${studentId}"
                    val emptyRequestBody = "".toRequestBody("application/json".toMediaType())

                    val (responseStatus, responseString) = apiRequest.putRequest(url, emptyRequestBody)

                    // Se quita el popup de "Cargando"
                    progressDialog.dismiss()

                    if (responseStatus) {
                        requireActivity().runOnUiThread {
                            AlertDialog.Builder(requireContext())
                                .setTitle("Éxito")
                                .setMessage("Estudiante eliminado exitosamente")
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
            val url = "https://appbibliotec.azurewebsites.net/api/estudiante?id=${studentId}"

            val (responseStatus, responseString) = apiRequest.getRequest(url)

            // Se quita el popup de "Cargando"
            detailsLoaded = true
            if (detailsLoaded) { // prueba igual que arriba
                progressDialog.dismiss()
            }

            if (responseStatus) {
                val json = gson.fromJson(responseString, JsonArray::class.java)
                val valores = json[0].asJsonObject

                selectedCalendar.time = LocalDate.parseIso(valores.get("fechaDeNacimiento").asString)

                requireActivity().runOnUiThread {
                    idBox.setText("$studentId ${getString(R.string.modify_room_id)}")

                    nameBox.setText(valores.get("nombre").asString)

                    firstLNameBox.setText(valores.get("apellido1").asString)

                    secondLNameBox.setText(valores.get("apellido2").asString)

                    cedulaBox.setText(valores.get("cedula").asString)

                    carneBox.setText(valores.get("carnet").asString)

                    correoBox.setText(valores.get("correo").asString)

                    claveBox.setText("")

                    bdayBox.setText(
                        LocalDate.date(
                            valores.get("fechaDeNacimiento").asString,
                            true,
                            fullDate = true
                        )
                    )

                    try {
                        statusSpinner.setSelection(if (valores.get("activo").asBoolean) 0 else 1)
                    } catch (e: Exception) {
                        statusSpinner.setSelection(0)
                    }

                    statusSpinner.onItemSelectedListener =
                        object : AdapterView.OnItemSelectedListener {
                            override fun onItemSelected(
                                parent: AdapterView<*>,
                                view: View?,
                                position: Int,
                                id: Long
                            ) {
                                selectedStatus = position == 0
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

    private fun onClickDateFilter(view: View) {
        val bdayBox = view.findViewById<EditText>(R.id.editEstFNacimiento)

        val year = selectedCalendar.get(Calendar.YEAR)
        val month = selectedCalendar.get(Calendar.MONTH)
        val day = selectedCalendar.get(Calendar.DAY_OF_MONTH)

        val listener = DatePickerDialog.OnDateSetListener { _, y, m, d ->
            val currentCalendar = Calendar.getInstance()
            val currYear = currentCalendar.get(Calendar.YEAR)
            val currMonth = currentCalendar.get(Calendar.MONTH)
            val currDay = currentCalendar.get(Calendar.DAY_OF_MONTH)

            if (y > currYear || (y == currYear && m > currMonth) || (y == currYear && m == currMonth && d > currDay)) {
                AlertDialog.Builder(requireContext())
                    .setTitle("Datos inválidos")
                    .setMessage("No puede ingresar una fecha futura")
                    .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                    .show()
            } else {
                selectedCalendar.set(y, m, d)
                //endCalendar.set(y, m, d)

                bdayBox.setText(LocalDate.date(selectedCalendar.time, fullDate = true))
            }
        }

        DatePickerDialog(requireContext(), listener, year, month, day).show()
    }

    private fun isValidEmail(email: String): Boolean {
        val regex = Regex("^\\w+@estudiantec\\.cr$")
        return regex.matches(email)
    }

}