package com.example.bibliotec.ui

import android.app.AlertDialog
import android.app.DatePickerDialog
import android.app.ProgressDialog
import android.app.TimePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.bibliotec.R
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.databinding.FragmentFiltersBinding
import com.example.bibliotec.user.User
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import java.util.Calendar
import kotlin.time.Duration.Companion.hours

class FiltersFragment : Fragment() {

    private var _binding: FragmentFiltersBinding? = null
    private val binding get() = _binding!!
    private lateinit var apiRequest: ApiRequest
    private lateinit var user : User
    private val gson = Gson()
    private lateinit var recyclerView: RecyclerView
    private val selectedCalendar = Calendar.getInstance()

    private var startTimeHour : Int? = null
    private var startTimeMin : Int? = null
    private var endTimeHour : Int? = null
    private var endTimeMin : Int? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentFiltersBinding.inflate(inflater, container, false)
        user = User.getInstance(requireContext())
        apiRequest = ApiRequest.getInstance(requireContext())

        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Se agrega el listener al botón "Buscar"
        val buscarButton = view.findViewById<Button>(R.id.btnFiltrar)
        buscarButton.setOnClickListener {
            AlertDialog.Builder(requireContext())
                .setTitle("Advertencia")
                .setMessage("Esta función aún no ha sido implementada")
                .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                .show()
        }

        // Se agregan los listeners a la fecha y a las horas
        val editTextDateFilter = view.findViewById<EditText>(R.id.date_filter_edit)
        editTextDateFilter.setOnClickListener{
            onClickDateFilter(view)
        }

        val startTimeFilter = view.findViewById<EditText>(R.id.start_time_filter_edit)
        startTimeFilter.setOnClickListener {
            onClickTimeFilter(view, true)
        }

        val endTimeFilter = view.findViewById<EditText>(R.id.end_time_filter_edit)
        endTimeFilter.setOnClickListener {
            onClickTimeFilter(view, false)
        }

        // Se debe cargar la lista de servicios
        recyclerView = view.findViewById(R.id.service_filter_recycler)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())

        // Se abre un popup de "Cargando"
        val progressDialog = ProgressDialog(requireContext())
        progressDialog.setMessage("Cargando...")
        progressDialog.setCancelable(false)
        progressDialog.show()

        GlobalScope.launch(Dispatchers.IO) {
            val url = "https://appbibliotec.azurewebsites.net/api/cubiculo/servicios"

            val (responseStatus, responseString) = apiRequest.getRequest(url)

            // Se quita el popup de "Cargando"
            progressDialog.dismiss()

            if (responseStatus) {
                val json = gson.fromJson(responseString, JsonObject::class.java)
                val serviciosList = json.get("servicios").asJsonArray
                val checkBoxItemList = serviciosList.map { CheckboxListItem(it.asString, false) }
                requireActivity().runOnUiThread() {
                    val adapter = FilterAdapter(checkBoxItemList)
                    recyclerView.adapter = adapter
                }
            } else {
                if (user.isLoggedIn()) {
                    // Ocurrió un error al hacer la consulta
                    requireActivity().runOnUiThread() {
                        AlertDialog.Builder(requireContext())
                            .setTitle("Error")
                            .setMessage(responseString)
                            .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                            .show()
                    }
                    findNavController().navigateUp()
                } else {
                    // La sesión expiró
                    requireActivity().runOnUiThread() {
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

    private fun onClickDateFilter(view : View) {
        val dateBox = view.findViewById<EditText>(R.id.date_filter_edit)

        var year : Int
        var month : Int
        var day : Int

        if (dateBox.text.toString().trim().isEmpty()) {
            year = selectedCalendar.get(Calendar.YEAR)
            month = selectedCalendar.get(Calendar.MONTH)
            day = selectedCalendar.get(Calendar.DAY_OF_MONTH)
        } else {
            var splittedString = dateBox.text.toString().trim().split('/')
            year = splittedString[0].toInt()
            month = splittedString[1].toInt() - 1
            day = splittedString[2].toInt()
        }

        val listener = DatePickerDialog.OnDateSetListener{ _, y, m, d ->
            selectedCalendar.set(y, m, d)
            val mes = m + 1
            dateBox.setText("$y/$mes/$d")
        }
        DatePickerDialog(requireContext(), listener, year, month, day).show()
    }

    private fun onClickTimeFilter(view : View, isStart : Boolean) {
        val timeBox = if (isStart) {
            view.findViewById<EditText>(R.id.start_time_filter_edit)
        } else {
            view.findViewById<EditText>(R.id.end_time_filter_edit)
        }

        var hour : Int
        var minute : Int

        if (isStart) {
            if (startTimeHour == null) {
                val currentTime = Calendar.getInstance().time
                hour = currentTime.hours
                minute = currentTime.minutes
            } else {
                hour = startTimeHour!!
                minute = startTimeMin!!
            }
        } else {
            if (endTimeHour == null) {
                val currentTime = Calendar.getInstance().time
                hour = currentTime.hours
                minute = currentTime.minutes
            } else {
                hour = endTimeHour!!
                minute = endTimeMin!!
            }
        }

        val listener = TimePickerDialog.OnTimeSetListener { _, h, m ->
            if (isStart) {
                startTimeHour = h
                startTimeMin = m
            } else {
                endTimeHour = h
                endTimeMin = m
            }

            timeBox.setText(String.format("%02d:%02d", h, m))
        }

        TimePickerDialog(requireContext(), listener, hour, minute, false).show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}