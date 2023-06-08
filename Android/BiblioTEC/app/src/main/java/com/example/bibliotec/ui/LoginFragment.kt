package com.example.bibliotec.ui

import android.app.AlertDialog
import android.app.ProgressDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.example.bibliotec.R
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.databinding.FragmentLoginBinding
import com.example.bibliotec.user.User
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody

class LoginFragment : Fragment() {

    private var _binding: FragmentLoginBinding? = null
    private lateinit var apiRequest: ApiRequest
    private lateinit var user: User

    // This property is only valid between onCreateView and
    // onDestroyView.
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {

        user = User.getInstance(requireContext())
        apiRequest = ApiRequest.getInstance(requireContext())
        _binding = FragmentLoginBinding.inflate(inflater, container, false)
        return binding.root

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnIniciarSesion.setOnClickListener {
            val editTextUsername = view.findViewById<EditText>(R.id.editTextEmail)
            val editTextPassword = view.findViewById<EditText>(R.id.editTextClave)

            // Obtener el texto ingresado
            val username = editTextUsername.text.toString()
            val password = editTextPassword.text.toString()

            // Se abre un popup de "Cargando"
            val progressDialog = ProgressDialog(requireContext())
            progressDialog.setMessage("Iniciando sesión...")
            progressDialog.setCancelable(false)
            progressDialog.show()

            // Solicitud POST del inicio de sesión
            GlobalScope.launch(Dispatchers.IO) {
                val url = "https://appbibliotec.azurewebsites.net/api/login"
                val requestBody =
                    "{\"email\": \"${username}\", \"password\":\"${password}\"}".toRequestBody("application/json".toMediaTypeOrNull())

                val (responseStatus, responseString) = apiRequest.postRequest(url, requestBody)

                // Se quita el popup de "Cargando"
                progressDialog.dismiss()

                if (responseStatus) {
                    user.storeUserInfo(responseString)
                    user.setCheckedInCurrentSession()

                    if (user.isAdmin()) {
                        requireActivity().runOnUiThread {
                            findNavController().navigate(R.id.action_LoginFragment_to_AdminFragment)
                        }
                    } else {
                        requireActivity().runOnUiThread {
                            findNavController().navigate(R.id.action_LoginFragment_to_StudentFragment)
                        }
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

        binding.btnRegistrarse.setOnClickListener {
            findNavController().navigate(R.id.action_LoginFragment_to_RegistroFragment)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}