package com.example.bibliotec.ui

import android.app.AlertDialog
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.navigation.fragment.findNavController
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.R
import com.example.bibliotec.databinding.FragmentLoginBinding
import com.example.bibliotec.user.User
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import okhttp3.RequestBody
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException

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
    ): View? {

        apiRequest = ApiRequest.getInstance(requireContext())
        user = User.getInstance(requireContext())
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
            // Solicitud PUT login
            GlobalScope.launch(Dispatchers.IO) {
                val url = "https://appbibliotec.azurewebsites.net/api/login"
                val requestBody =
                    "{\"email\": \"${username}\", \"password\":\"${password}\"}".toRequestBody("application/json".toMediaTypeOrNull())

                val (responseStatus, responseString) = apiRequest.postRequest(url, requestBody)
                if (responseStatus) {
                    user.storeUserInfo(responseString)
                    user.checkedInCurrentSession = true

                    if (user.isAdmin()) {
                        requireActivity().runOnUiThread() {
                            findNavController().navigate(R.id.action_LoginFragment_to_AdminFragment)
                        }
                    } else {
                        requireActivity().runOnUiThread() {
                            findNavController().navigate(R.id.action_LoginFragment_to_StudentFragment)
                        }
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

        binding.btnRegistrarse.setOnClickListener{
            findNavController().navigate(R.id.action_LoginFragment_to_RegistroFragment)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}