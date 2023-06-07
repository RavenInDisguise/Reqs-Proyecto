package com.example.bibliotec.ui

import androidx.fragment.app.Fragment
import android.app.AlertDialog
import android.app.DatePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.navigation.fragment.findNavController
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.R
import com.example.bibliotec.databinding.FragmentSignupBinding
import com.example.bibliotec.misc.LocalDate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.*

class SignUpFragment : Fragment() {
    private var _binding: FragmentSignupBinding? = null
    private lateinit var apiRequest : ApiRequest
    private val binding get() = _binding!!
    val selectedCalendar = Calendar.getInstance()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSignupBinding.inflate(inflater, container, false)
        apiRequest = ApiRequest.getInstance(requireContext())
        return binding.root

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val editTextFechaNacimiento = view.findViewById<EditText>(R.id.editTextFechaNacimiento)
        editTextFechaNacimiento.setOnClickListener{
            onClickFechaDate(view)
        }

        // Acción de click al botón de registrarse
        binding.btnRegistro.setOnClickListener{
            // Obteniendo cada input
            val editTextNombre = view.findViewById<EditText>(R.id.editTextNombre)
            val editTextApellido1 = view.findViewById<EditText>(R.id.editTextApellido1)
            val editTextApellido2 = view.findViewById<EditText>(R.id.editTextApellido2)
            val editTextCedula = view.findViewById<EditText>(R.id.editTextCedula)
            val editTextCarnet = view.findViewById<EditText>(R.id.editTextCarnet)
            val editTextCorreo = view.findViewById<EditText>(R.id.editTextEmailRegistro)
            val editTextClaveRegistro = view.findViewById<EditText>(R.id.editTextClaveRegistro)

            // Obteniendo el texto en cada input
            val nombre = editTextNombre.text.toString()
            val apellido1 = editTextApellido1.text.toString()
            val apellido2 = editTextApellido2.text.toString()
            val cedula = editTextCedula.text.toString()
            val carnet = editTextCarnet.text.toString()
            val fechaNacimiento = "${
                selectedCalendar.get(Calendar.YEAR)}/${selectedCalendar.get(Calendar.MONTH) + 1}/${
                selectedCalendar.get(Calendar.DAY_OF_MONTH)}"
            val correo = editTextCorreo.text.toString()
            val clave = editTextClaveRegistro.text.toString()

            // Se valida que cada input no sea vacio
            if(nombre.isNullOrEmpty() ||
                    apellido1.isNullOrEmpty() ||
                    apellido2.isNullOrEmpty() ||
                    cedula.isNullOrEmpty() ||
                    carnet.isNullOrEmpty() ||
                    fechaNacimiento.isNullOrEmpty() ||
                    correo.isNullOrEmpty() ||
                    clave.isNullOrEmpty()
            ){
                AlertDialog.Builder(requireContext())
                    .setTitle("Datos inválidos")
                    .setMessage("Debe llenar todos los datos correctamente.")
                    .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                    .show()
            }
            // Se valida que el correo pertenezca a @estudiantec.cr
            else if(!isValidEmail(correo)){
                AlertDialog.Builder(requireContext())
                    .setTitle("Correo inválido")
                    .setMessage("El correo debe pertenecer al dominio @estudiantec.cr")
                    .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                    .show()
            }
            // Se realiza la llamda al API
            else {
                GlobalScope.launch(Dispatchers.IO) {
                    val url = "https://appbibliotec.azurewebsites.net/api/estudiante/crear"
                    val requestBody =
                        ("{\"nombre\": \"${nombre}\"," +
                                "\"apellido1\":\"${apellido1}\"," +
                                "\"apellido2\":\"${apellido2}\"," +
                                "\"cedula\":\"${cedula}\"," +
                                "\"carnet\":\"${carnet}\"," +
                                "\"fechaDeNacimiento\":\"${fechaNacimiento}\"," +
                                "\"correo\":\"${correo}\"," +
                                "\"clave\":\"${clave}\"}").toRequestBody("application/json".toMediaTypeOrNull())

                    val (responseStatus, responseString) = apiRequest.postRequest(url, requestBody)
                    if (responseStatus) {
                        requireActivity().runOnUiThread {
                            AlertDialog.Builder(requireContext())
                                .setTitle("Éxito")
                                .setMessage("Registro exitoso")
                                .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                                .show()
                            findNavController().navigateUp()
                        }

                    } else {
                        requireActivity().runOnUiThread {
                            AlertDialog.Builder(requireContext())
                                .setTitle("Error")
                                .setMessage(responseString)
                                .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                                .show()
                        }
                    }
                }
            }
        }
    }

    // Función para el datepicker de la fecha de nacimiento
    private fun onClickFechaDate(view:View){

        val fechaNacimiento = view.findViewById<EditText>(R.id.editTextFechaNacimiento)

        val year = selectedCalendar.get(Calendar.YEAR)
        val month = selectedCalendar.get(Calendar.MONTH)
        val day = selectedCalendar.get(Calendar.DAY_OF_MONTH)
        val listener = DatePickerDialog.OnDateSetListener{datePicker, y, m, d ->
            selectedCalendar.set(y, m, d)
            fechaNacimiento.setText(LocalDate.date((selectedCalendar.time)))
        }
        DatePickerDialog(requireContext(), listener, year, month, day).show()
    }

    fun isValidEmail(email: String): Boolean {
        val regex = Regex("^\\w+@estudiantec\\.cr$")
        return regex.matches(email)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}