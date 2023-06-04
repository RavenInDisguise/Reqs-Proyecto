package com.example.bibliotec.ui

import android.app.AlertDialog
import android.app.ProgressDialog
import androidx.fragment.app.Fragment
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.bibliotec.R
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.data.ServicePerRoom
import com.example.bibliotec.databinding.FragmentBookingBinding
import com.example.bibliotec.user.User
import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import java.text.SimpleDateFormat
import java.util.*

class BookingFragment : Fragment() {
    private var _binding: FragmentBookingBinding? = null
    private lateinit var apiRequest: ApiRequest
    private val binding get() = _binding!!
    private lateinit var recyclerView: RecyclerView
    private lateinit var user: User
    private lateinit var horaInicio: String
    private lateinit var horaFin: String
    private var cubiculoId = -1
    private val gson = Gson()
    private lateinit var servicePerRoomList: List<ServicePerRoom>

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentBookingBinding.inflate(inflater, container, false)
        user = User.getInstance(requireContext())
        apiRequest = ApiRequest.getInstance(requireContext())
        arguments?.let {
            horaInicio = it.getString("horaInicio")!!
            horaFin = it.getString("horaFin")!!
            cubiculoId = it.getInt("cubiculoId")!!
        }
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val nombreCubiculo = view.findViewById<TextView>(R.id.nombreCubiculo)
        val capacidadCubiculo = view.findViewById<TextView>(R.id.capacidadCubiculo)
        val horario = view.findViewById<TextView>(R.id.horarioReserva)
        val recyclerView = view.findViewById<RecyclerView>(R.id.serviciosReservaRecycler)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())

        val progressDialog = ProgressDialog(requireContext())
        progressDialog.setMessage("Cargando...")
        progressDialog.setCancelable(false)
        progressDialog.show()

        GlobalScope.launch(Dispatchers.IO) {
            val url = "https://appbibliotec.azurewebsites.net/api/cubiculo?id=$cubiculoId"

            val (responseStatus, responseString) = apiRequest.getRequest(url)

            // Se quita el popup de "Cargando"
            progressDialog.dismiss()

            if (responseStatus) {
                val json = gson.fromJson(responseString, JsonArray::class.java)
                val valores = (json[0] as JsonObject)

                val id = valores.get("id").asInt
                val nombre = valores.get("nombre").asString
                val capacidad = valores.get("capacidad").asString
                val minutosMaximo = valores.get("minutosMaximo").asInt

                val fecha = getDate(horaInicio)
                horaFin = sumarMinutosATiempo(horaInicio, minutosMaximo)

                servicePerRoomList = valores.get("servicios")
                    .asJsonArray.map {
                        ServicePerRoom(
                            it.asJsonObject.get("nombre").toString(),
                            it.asJsonObject.get("activo").asBoolean
                        )
                    }

                requireActivity().runOnUiThread() {
                    nombreCubiculo.setText(nombre)
                    capacidadCubiculo.setText(capacidad)
                    horario.setText("$fecha de ${convertToUTCMinus6(horaInicio)} a ${convertToUTCMinus6(horaFin)}")
                    val adapter = BookingAdapter(servicePerRoomList)
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
                        findNavController().navigateUp()
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

        binding.btnReservar.setOnClickListener{
            GlobalScope.launch(Dispatchers.IO) {
                val url = "https://appbibliotec.azurewebsites.net/api/cubiculo/reservar"
                val requestBody =
                    ("{\"idCubiculo\": \"$cubiculoId\"," +
                            "\"idEstudiante\":${user.getStudentId()}," +
                            "\"horaInicio\":\"$horaInicio\"," +
                            "\"horaFin\":\"$horaFin\"," +
                            "\"email\":\"${user.getEmail()}\"," +
                            "\"nombre\":\"${nombreCubiculo.text.toString()}\"}").toRequestBody("application/json".toMediaTypeOrNull())
                println("{\"idCubiculo\": \"$cubiculoId\"," +
                        "\"idEstudiante\":${user.getStudentId()}," +
                        "\"horaInicio\":\"$horaInicio\"," +
                        "\"horaFin\":\"$horaFin\"," +
                        "\"email\":\"${user.getEmail()}\"," +
                        "\"nombre\":\"${nombreCubiculo.text.toString()}\"}")
                val (responseStatus, responseString) = apiRequest.postRequest(url, requestBody)
                if (responseStatus) {
                    requireActivity().runOnUiThread() {
                        AlertDialog.Builder(requireContext())
                            .setTitle("Éxito")
                            .setMessage("Reserva exitosa")
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

    fun convertToUTCMinus6(dateTimeString: String): String {
        val sourceFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
        sourceFormat.timeZone = TimeZone.getTimeZone("UTC")

        val targetFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
        targetFormat.timeZone = TimeZone.getTimeZone("GMT-6:00")

        val sourceDate = sourceFormat.parse(dateTimeString)
        val targetTimeString = targetFormat.format(sourceDate)

        return targetTimeString
    }

    fun getDate(dateTimeString: String): String {
        val sourceFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
        val sourceDate = sourceFormat.parse(dateTimeString)

        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

        val date = dateFormat.format(sourceDate)

        return date
    }

    fun sumarMinutosATiempo(tiempo: String, minutosASumar: Int): String {
        val formato = SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
        val tiempoDate = formato.parse(tiempo)

        val calendar = Calendar.getInstance()
        calendar.time = tiempoDate
        calendar.add(Calendar.MINUTE, minutosASumar)

        return formato.format(calendar.time)
    }
}