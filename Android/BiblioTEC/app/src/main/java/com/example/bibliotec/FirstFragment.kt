package com.example.bibliotec

import android.app.AlertDialog
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.navigation.fragment.findNavController
import com.example.bibliotec.databinding.FragmentFirstBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import okhttp3.RequestBody
import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import java.io.IOException

/**
 * A simple [Fragment] subclass as the default destination in the navigation.
 */
class FirstFragment : Fragment() {

    private var _binding: FragmentFirstBinding? = null
    private val apiRequest = ApiRequest()
    // This property is only valid between onCreateView and
    // onDestroyView.
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {

        _binding = FragmentFirstBinding.inflate(inflater, container, false)
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
                val requestBody = RequestBody.create(
                    "application/json".toMediaTypeOrNull(),
                    "{\"email\": \"${username}\", \"password\":\"${password}\"}")
                try {
                    val response = apiRequest.postRequest(url, requestBody)
                    requireActivity().runOnUiThread() {
                        findNavController().navigate(R.id.action_FirstFragment_to_SecondFragment)
                    }
                }
                catch (error: IOException) {
                    requireActivity().runOnUiThread() {
                        AlertDialog.Builder(requireContext())
                            .setTitle("Error")
                            .setMessage("Usuario o contraseña incorrecta")
                            .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                            .show()
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