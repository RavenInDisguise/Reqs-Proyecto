package com.example.bibliotec.ui

import android.app.AlertDialog
import android.app.ProgressDialog
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.nfc.Tag
import android.os.Bundle
import android.util.Log
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.bibliotec.R
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.data.ServicePerRoomItem
import com.example.bibliotec.databinding.FragmentBookingConfirmationBinding
import com.example.bibliotec.user.User
import com.example.bibliotec.misc.LocalDate
import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonPrimitive
import com.squareup.picasso.Picasso
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import java.util.*

class BookingConfirmationFragment : Fragment() {
    //variables
    private var _binding: FragmentBookingConfirmationBinding? = null
    private lateinit var apiRequest: ApiRequest
    private val binding get() = _binding!!
    private lateinit var user: User
    private lateinit var horaInicio : String
    private lateinit var horaFin : String
    private val gson = Gson()
    private var reservationId: Int = -1
    private var idCubiculo: Int = -1
    private lateinit var servicePerRoomList: List<ServicePerRoomItem>
    private var errorOccurred = false
    private var roomInfoLoaded = false
    private var qrCodeLoaded = false

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentBookingConfirmationBinding.inflate(inflater, container, false)
        user = User.getInstance(requireContext())
        apiRequest = ApiRequest.getInstance(requireContext())

        arguments?.let {
            reservationId = it.getInt("id", -1)
            horaInicio = it.getString("horaInicio")!!
            horaFin = it.getString("horaFin")!!
            idCubiculo = it.getInt("idCubiculo")
        }

        if (id == -1){
            findNavController().navigateUp()
        }

        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val cubicleName = view.findViewById<TextView>(R.id.cubiName)
        val cubicleCapacity = view.findViewById<TextView>(R.id.capacityCubi)
        val cubicleSchedule = view.findViewById<TextView>(R.id.scheduleCubiReserva)
        val cubicleRecycler = view.findViewById<RecyclerView>(R.id.servicesCubiRecycler)
        cubicleRecycler?.layoutManager = LinearLayoutManager(requireContext())
        val codeQR = view.findViewById<ImageView>(R.id.codeReservation)
        val progressBar = view.findViewById<ProgressBar>(R.id.progressBar)
        val btnAceptar = view.findViewById<Button>(R.id.btnReserveCubi)

        val progressDialog = ProgressDialog(requireContext())
        progressDialog.setMessage("Cargando...")
        progressDialog.setCancelable(false)
        progressDialog.show()

        btnAceptar.setOnClickListener{
            findNavController().navigateUp()
        }

        GlobalScope.launch(Dispatchers.IO) {
            val url = "https://appbibliotec.azurewebsites.net/api/cubiculo?id=$idCubiculo"

            val (responseStatus, responseString) = apiRequest.getRequest(url)

            // Se quita el popup de "Cargando"
            roomInfoLoaded = true
            if (qrCodeLoaded) {
                progressDialog.dismiss()
            }

            if (responseStatus) {
                val json = gson.fromJson(responseString, JsonArray::class.java)
                val valores = (json[0] as JsonObject)

                val id = valores.get("id").asInt
                val nombre = valores.get("nombre").asString
                val capacidad = valores.get("capacidad").asString
                val minutosMaximo = valores.get("minutosMaximo").asInt

                val horaInicioObject = LocalDate.parseIso(horaInicio)
                var horaFinObject = LocalDate.parseIso(horaFin)

                val horaInicioCalendar = Calendar.getInstance()
                horaInicioCalendar.time = horaInicioObject

                val horaFinCalendar = Calendar.getInstance()
                horaFinCalendar.time = horaFinObject

                val horaFinMaxCalendar = Calendar.getInstance()
                horaFinMaxCalendar.time = horaInicioCalendar.time
                horaFinMaxCalendar.add(Calendar.MINUTE, minutosMaximo)

                if (horaFinCalendar > horaFinMaxCalendar) {
                    horaFinObject = horaFinMaxCalendar.time
                    horaFin = LocalDate.toUtc(horaFinObject)
                }

                servicePerRoomList = valores.get("servicios")
                    .asJsonArray.map {
                        ServicePerRoomItem(
                            it.asJsonObject.get("nombre").asString,
                            it.asJsonObject.get("activo").asBoolean
                        )
                    }

                val bookingTime = (horaFinObject.time - horaInicioObject.time) / (1000 * 60)

                var bookingTimeString = LocalDate.durationString(bookingTime.toInt())

                requireActivity().runOnUiThread {
                    cubicleName?.text = nombre
                    cubicleCapacity?.text = "$capacidad persona${if (capacidad.toInt() == 1) "" else "s"}"
                    cubicleSchedule?.text = "${
                        LocalDate.date(horaInicioObject, true)
                    },\nde ${LocalDate.time(horaInicioObject)} a ${
                        LocalDate.time(horaFinObject)
                    } ($bookingTimeString)"
                    val adapter = BookingAdapter(servicePerRoomList)
                    cubicleRecycler?.adapter = adapter
                }
            } else {
                if (!errorOccurred) {
                    // Si más de un request da un error, solo se muestra una vez
                    errorOccurred = true
                    if (user.isLoggedIn()) {
                        // Ocurrió un error al hacer la consulta
                        requireActivity().runOnUiThread {
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
                        requireActivity().runOnUiThread {
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

        GlobalScope.launch(Dispatchers.IO){
            val url = "https://appbibliotec.azurewebsites.net/api/reserva/qr?id=$reservationId"

            val (responseStatus, responseString, imageData) = apiRequest.getRequestBytes(url)

            // Se quita el popup de "Cargando"
            qrCodeLoaded = true
            if (roomInfoLoaded) {
                progressDialog.dismiss()
            }

            val bitmap = BitmapFactory.decodeByteArray(imageData, 0, imageData?.size ?: 0)
            val tempFile = File(requireContext().cacheDir, "temp_booking_$reservationId.png")
            val outputStream = FileOutputStream(tempFile)
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
            outputStream.close()

            val imageUri = Uri.fromFile(tempFile)

            if (responseStatus) {
                requireActivity().runOnUiThread {
                    Picasso.get().load(imageUri).into(codeQR)
                    codeQR.visibility = View.VISIBLE
                    progressBar.visibility = View.GONE
                }
            } else {
                if (!errorOccurred) {
                    // Si más de un request da un error, solo se muestra una vez
                    errorOccurred = true
                    if (user.isLoggedIn()) {
                        // Ocurrió un error al hacer la consulta
                        requireActivity().runOnUiThread {
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
                        requireActivity().runOnUiThread {
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


    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}