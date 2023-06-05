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
import com.example.bibliotec.data.CheckboxListItem
import com.example.bibliotec.databinding.FragmentFiltersBinding
import com.example.bibliotec.misc.LocalDate
import com.example.bibliotec.user.User
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import java.util.Calendar

class FiltersFragment : Fragment() {

    private var _binding: FragmentFiltersBinding? = null
    private val binding get() = _binding!!
    private lateinit var apiRequest: ApiRequest
    private lateinit var user: User
    private val gson = Gson()
    private lateinit var recyclerView: RecyclerView
    private var startCalendar = Calendar.getInstance()
    private var endCalendar = Calendar.getInstance()
    private var calendarsReady = false
    private lateinit var checkBoxItemList: List<CheckboxListItem>

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

        if (!calendarsReady) {
            calendarsReady = true

            // Se agregan minutos a las horas de inicio y salida
            startCalendar.add(Calendar.MINUTE, 10)
            startCalendar.set(Calendar.MILLISECOND, 0)
            startCalendar.set(Calendar.SECOND, 0)

            endCalendar.add(Calendar.MINUTE, 70)
            endCalendar.set(Calendar.MILLISECOND, 0)
            endCalendar.set(Calendar.SECOND, 0)

            // Para evitar problemas si la instancia se creó para días diferentes
            // (por ejemplo, si la aplicación se abrió casi a medianoche)
            endCalendar.set(
                startCalendar.get(Calendar.YEAR),
                startCalendar.get(Calendar.MONTH),
                startCalendar.get(Calendar.DAY_OF_MONTH)
            )
        }

        // Se agregan los listeners a la fecha y a las horas
        val editTextDateFilter = view.findViewById<EditText>(R.id.date_filter_edit)
        editTextDateFilter.setOnClickListener {
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

        val capacityFilter = view.findViewById<EditText>(R.id.capacity_filter_edit)

        // Se agrega el listener al botón "Buscar"
        val buscarButton = view.findViewById<Button>(R.id.btnFiltrar)
        buscarButton.setOnClickListener {
            // Validaciones
            var filtersOk = true
            var message = ""
            var capacity = 1

            var currentCalendar = Calendar.getInstance()

            if (editTextDateFilter.text.toString().isEmpty()) {
                filtersOk = false
                message = "La fecha no debe estar vacía"
            } else if (startTimeFilter.text.toString().isEmpty()) {
                filtersOk = false
                message = "La hora de inicio no debe estar vacía"
            } else if (endTimeFilter.text.toString().isEmpty()) {
                filtersOk = false
                message = "La hora de salida no debe estar vacía"
            } else if (startCalendar >= endCalendar) {
                filtersOk = false
                message = "La hora de salida debe ser mayor que la hora de inicio"
            } else if (startCalendar < currentCalendar) {
                filtersOk = false
                message = "La hora de inicio no puede ser anterior a la hora actual"
            } else {
                try {
                    capacity = capacityFilter.text.toString().toInt()
                    if (capacity < 1) {
                        filtersOk = false
                        message = "La capacidad no puede ser menor a 1"
                    }
                } catch (e: Exception) {
                    filtersOk = false
                    message = "La capacidad debe ser un valor numérico"
                }
            }

            if (!filtersOk) {
                AlertDialog.Builder(requireContext())
                    .setTitle("Datos inválidos")
                    .setMessage(message)
                    .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                    .show()
            } else {
                val bundle = Bundle()
                bundle.putString("horaInicio", LocalDate.toUtc(startCalendar))
                bundle.putString("horaFin", LocalDate.toUtc(endCalendar))
                bundle.putInt("capacidad", capacity)
                bundle.putStringArray("servicios", checkBoxItemList.filter { it.isChecked }
                    .map { it.text }.toTypedArray())
                findNavController().navigate(
                    R.id.action_FiltersFragment_toAvailableRoomsFragment,
                    bundle
                )
            }
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
                checkBoxItemList = serviciosList.map { CheckboxListItem(it.asString, false) }
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
                            .setPositiveButton("OK") { dialog, _ ->
                                dialog.dismiss()
                                findNavController().navigateUp()
                            }
                            .show()
                    }
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

    private fun onClickDateFilter(view: View) {
        val dateBox = view.findViewById<EditText>(R.id.date_filter_edit)

        val year = startCalendar.get(Calendar.YEAR)
        val month = startCalendar.get(Calendar.MONTH)
        val day = startCalendar.get(Calendar.DAY_OF_MONTH)

        val listener = DatePickerDialog.OnDateSetListener { _, y, m, d ->
            val currentCalendar = Calendar.getInstance()
            val currYear = currentCalendar.get(Calendar.YEAR)
            val currMonth = currentCalendar.get(Calendar.MONTH)
            val currDay = currentCalendar.get(Calendar.DAY_OF_MONTH)

            if (y < currYear || (y == currYear && m < currMonth) || (y == currYear && m == currMonth && d < currDay)) {
                AlertDialog.Builder(requireContext())
                    .setTitle("Datos inválidos")
                    .setMessage("No puede ingresar una fecha pasada")
                    .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                    .show()
            } else {
                startCalendar.set(y, m, d)
                endCalendar.set(y, m, d)

                dateBox.setText(LocalDate.date(startCalendar.time, fullDate = true))
            }
        }

        DatePickerDialog(requireContext(), listener, year, month, day).show()
    }

    private fun onClickTimeFilter(view: View, isStart: Boolean) {
        val timeBox = if (isStart) {
            view.findViewById<EditText>(R.id.start_time_filter_edit)
        } else {
            view.findViewById<EditText>(R.id.end_time_filter_edit)
        }

        var hour = if (isStart) {
            startCalendar.get(Calendar.HOUR_OF_DAY)
        } else {
            endCalendar.get(Calendar.HOUR_OF_DAY)
        }

        var minute = if (isStart) {
            startCalendar.get(Calendar.MINUTE)
        } else {
            endCalendar.get(Calendar.MINUTE)
        }

        val listener = TimePickerDialog.OnTimeSetListener { _, h, m ->
            if (isStart) {
                startCalendar.set(Calendar.HOUR_OF_DAY, h)
                startCalendar.set(Calendar.MINUTE, m)
                timeBox.setText(LocalDate.time(startCalendar.time))
            } else {
                endCalendar.set(Calendar.HOUR_OF_DAY, h)
                endCalendar.set(Calendar.MINUTE, m)
                timeBox.setText(LocalDate.time(endCalendar.time))

                // Para evitar problemas si la instancia se creó para días diferentes
                // (por ejemplo, si la aplicación se abrió casi a medianoche)
                endCalendar.set(
                    startCalendar.get(Calendar.YEAR),
                    startCalendar.get(Calendar.MONTH),
                    startCalendar.get(Calendar.DAY_OF_MONTH)
                )
            }
        }

        TimePickerDialog(requireContext(), listener, hour, minute, false).show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}