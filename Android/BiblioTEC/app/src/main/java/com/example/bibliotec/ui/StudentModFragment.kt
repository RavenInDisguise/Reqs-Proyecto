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
    private var startCalendar = Calendar.getInstance()
    private var endCalendar = Calendar.getInstance()
    private var detailsLoaded = false
    private var errorOccurred = false
    private val gson = Gson()
    private var calendario = Calendar.getInstance()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {

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

            if (bdayBox.text.toString().isEmpty()) {
                filtersOk = false
                message = "La fecha de nacimiento no debe estar vacía"
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

                var selectedName = nameBox.text.toString()
                var selectedFName = firstLNameBox.text.toString()
                var selectedSName = secondLNameBox.text.toString()
                var selecteCedula = cedulaBox.text.toString()
                var selectedCarne = carneBox.text.toString()
                var selectedFecha = bdayBox.text.toString()
                var selectedCorreo = correoBox.text.toString()
                var selectedpassword = claveBox.text.toString()

                GlobalScope.launch(Dispatchers.IO) {
                    val url = "https://appbibliotec.azurewebsites.net/api/estudiante/actualizar"
                    val requestBody =
                        ("{\"idEstudiante\": \"$studentId\"," +
                                "\"nombre\": \"$selectedName\"," +
                                "\"apellido1\": \"$selectedFName\"," +
                                "\"apellido2\": \"$selectedSName\"," +
                                "\"cedula\": $selecteCedula," +
                                "\"carnet\": $selectedCarne," +
                                "\"fechaNacimiento\": \"${LocalDate.toIso(startCalendar)}\"," +
                                "\"correo\": \"$selectedCorreo\"," +
                                "\"clave\": \"$selectedpassword\"}").toRequestBody("application/json".toMediaTypeOrNull())

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

                startCalendar.time = LocalDate.parseIso(valores.get("fechaDeNacimiento").asString)
                //endCalendar.time = LocalDate.parseIso(valores.get("horaFin").asString)

                requireActivity().runOnUiThread {
                    idBox.setText("$studentId ${getString(R.string.modify_room_id)}")

                    nameBox.setText(valores.get("nombre").asString)

                    firstLNameBox.setText(valores.get("apellido1").asString)

                    secondLNameBox.setText(valores.get("apellido2").asString)

                    cedulaBox.setText(valores.get("cedula").asString)

                    carneBox.setText(valores.get("carnet").asString)

                    //bdayBox.setText(valores.get("fechaDeNacimiento").asString)

                    correoBox.setText(valores.get("correo").asString)

                    claveBox.setText("")

                    bdayBox.setText(
                        LocalDate.date(
                            valores.get("fechaDeNacimiento").asString,
                            true,
                            fullDate = true
                        )
                    )

                    /* */
                   // startTimeBox.setText(LocalDate.time(startCalendar.time))
                   // endTimeBox.setText(LocalDate.time(endCalendar.time))
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

        val year = startCalendar.get(Calendar.YEAR)
        val month = startCalendar.get(Calendar.MONTH)
        val day = startCalendar.get(Calendar.DAY_OF_MONTH)

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
                startCalendar.set(y, m, d)
                //endCalendar.set(y, m, d)

                bdayBox.setText(LocalDate.date(startCalendar.time, fullDate = true))
            }
        }

        DatePickerDialog(requireContext(), listener, year, month, day).show()
    }

}