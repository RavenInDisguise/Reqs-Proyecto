package com.example.bibliotec.ui

import androidx.fragment.app.Fragment
import android.app.AlertDialog
import android.app.DatePickerDialog
import android.app.ProgressDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.fragment.findNavController
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.R
import com.example.bibliotec.databinding.FragmentRegistroBinding
import com.example.bibliotec.user.User
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.*

class RegistroFragment : Fragment() {
    private var _binding: FragmentRegistroBinding? = null
    private lateinit var apiRequest : ApiRequest
    private val binding get() = _binding!!
    private lateinit var user : User
    val selectedCalendar = Calendar.getInstance()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentRegistroBinding.inflate(inflater, container, false)
        apiRequest = ApiRequest.getInstance(requireContext())
        user = User.getInstance(requireContext())
        return binding.root

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val editTextFechaNacimiento = view.findViewById<EditText>(R.id.editTextFechaNacimiento)
        editTextFechaNacimiento.setOnClickListener{
            onClickFechaDate(view)
        }
        binding.btnRegistro.setOnClickListener{
            val editTextNombre = view.findViewById<EditText>(R.id.editTextNombre)
            val editTextApellido1 = view.findViewById<EditText>(R.id.editTextApellido1)
            val editTextApellido2 = view.findViewById<EditText>(R.id.editTextApellido2)
            val editTextCedula = view.findViewById<EditText>(R.id.editTextCedula)
            val editTextCarnet = view.findViewById<EditText>(R.id.editTextCarnet)
            val editTextFechaNacimiento = view.findViewById<EditText>(R.id.editTextFechaNacimiento)
            val editTextCorreo = view.findViewById<EditText>(R.id.editTextEmailRegistro)
            val editTextClaveRegistro = view.findViewById<EditText>(R.id.editTextClaveRegistro)

            val nombre = editTextNombre.text.toString()
            val apellido1 = editTextApellido1.text.toString()
            val apellido2 = editTextApellido2.text.toString()
            val cedula = editTextCedula.text.toString()
            val carnet = editTextCarnet.text.toString()
            val fechaNacimiento = editTextFechaNacimiento.text.toString()
            val correo = editTextCorreo.text.toString()
            val clave = editTextClaveRegistro.text.toString()

            // Se abre un popup de "Cargando"
            val progressDialog = ProgressDialog(requireContext())
            progressDialog.setMessage("Registrando...")
            progressDialog.setCancelable(false)
            progressDialog.show()

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

                // Se quita el popup de "Cargando"
                progressDialog.dismiss()

                if (responseStatus) {
                    requireActivity().runOnUiThread() {
                        AlertDialog.Builder(requireContext())
                            .setTitle("Éxito")
                            .setMessage("Registro exitoso")
                            .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                            .show()
                        findNavController().navigateUp()
                    }

                } else {
                    requireActivity().runOnUiThread() {
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

    private fun onClickFechaDate(view:View){

        val fechaNacimiento = view.findViewById<EditText>(R.id.editTextFechaNacimiento)

        val year = selectedCalendar.get(Calendar.YEAR)
        val month = selectedCalendar.get(Calendar.MONTH)
        val day = selectedCalendar.get(Calendar.DAY_OF_MONTH)
        val listener = DatePickerDialog.OnDateSetListener{datePicker, y, m, d ->
            selectedCalendar.set(y,m,d)
            fechaNacimiento.setText("$y-$m-$d")
        }
        DatePickerDialog(requireContext(),listener,year,month,day).show()
    }
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}