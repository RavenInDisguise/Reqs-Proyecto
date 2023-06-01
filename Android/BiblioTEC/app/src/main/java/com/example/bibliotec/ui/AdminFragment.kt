package com.example.bibliotec.ui

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.example.bibliotec.R
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.databinding.FragmentAdminBinding
import com.example.bibliotec.user.User
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

class AdminFragment : Fragment() {

    private var _binding: FragmentAdminBinding? = null
    private lateinit var apiRequest : ApiRequest
    private val binding get() = _binding!!
    private val gson = Gson()
    private lateinit var user : User

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val activity = requireActivity() as AppCompatActivity
        activity.supportActionBar?.setDisplayHomeAsUpEnabled(false)

        _binding = FragmentAdminBinding.inflate(inflater, container, false)
        apiRequest = ApiRequest.getInstance(requireContext())
        user = User.getInstance(requireContext())
        return binding.root

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        binding.buttonSecond.setOnClickListener {
            findNavController().navigate(R.id.action_AdminFragment_to_LoginFragment)
        }

        // Si no se ha revisado el estado de la sesión desde que se abrió la aplicación,
        // se revisa aquí

        GlobalScope.launch(Dispatchers.IO) {
            val url = "https://appbibliotec.azurewebsites.net/api/login"

            val (responseStatus, responseString) = apiRequest.getRequest(url)
            if (responseStatus) {
                val json = gson.fromJson(responseString, JsonObject::class.java)

                if (json.has("loggedIn") && json.get("loggedIn").asBoolean) {
                    // El usuario continúa con la sesión activa
                } else {
                    // Ya se cerró la sesión
                    user.setTimedOut()
                    requireActivity().runOnUiThread() {
                        AlertDialog.Builder(requireContext())
                            .setTitle("Sesión expirada")
                            .setMessage("Su sesión ha expirado. Por favor, inicie sesión nuevamente.")
                            .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                            .show()
                        findNavController().navigate(R.id.action_AdminFragment_to_LoginFragment)
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

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}