package com.example.bibliotec

import android.app.AlertDialog
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.fragment.findNavController
import com.example.bibliotec.databinding.FragmentSecondBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody
import java.io.IOException

/**
 * A simple [Fragment] subclass as the second destination in the navigation.
 */
class SecondFragment : Fragment() {

    private var _binding: FragmentSecondBinding? = null
    private val apiRequest = ApiRequest()
    // This property is only valid between onCreateView and
    // onDestroyView.
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val activity = requireActivity() as AppCompatActivity
        activity.supportActionBar?.setDisplayHomeAsUpEnabled(false)
        _binding = FragmentSecondBinding.inflate(inflater, container, false)
        return binding.root

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        GlobalScope.launch(Dispatchers.IO) {
            val url = "https://appbibliotec.azurewebsites.net/api/login"

            try {
                val response = apiRequest.getRequest(url)
                println(response)
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
        binding.buttonSecond.setOnClickListener {
            findNavController().navigate(R.id.action_SecondFragment_to_FirstFragment)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}