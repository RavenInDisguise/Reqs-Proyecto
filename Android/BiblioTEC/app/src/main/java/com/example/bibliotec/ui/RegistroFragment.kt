package com.example.bibliotec.ui

import androidx.fragment.app.Fragment
import android.app.AlertDialog
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
import com.example.bibliotec.databinding.FragmentStudentBinding
import com.example.bibliotec.user.User
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody

class RegistroFragment : Fragment() {
    private var _binding: FragmentRegistroBinding? = null
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
        _binding = FragmentRegistroBinding.inflate(inflater, container, false)
        apiRequest = ApiRequest.getInstance(requireContext())
        user = User.getInstance(requireContext())
        return binding.root

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnRegistro.setOnClickListener{
            val editTextNombre = view.findViewById<EditText>(R.id.editTextNombre)
            val editTextApellido1 = view.findViewById<EditText>(R.id.editTextApellido1)
            val editTextApellido2 = view.findViewById<EditText>(R.id.editTextApellido2)
            val editTextCedula = view.findViewById<EditText>(R.id.editTextCedula)
            val editTextCarnet = view.findViewById<EditText>(R.id.editTextCarnet)
            val editTextFechaNacimiento = view.findViewById<EditText>(R.id.editTextFechaNacimiento)
            val editTextCorreo = view.findViewById<EditText>(R.id.editTextCorreo)
            val editTextClaveRegistro = view.findViewById<EditText>(R.id.editTextClaveRegistro)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}