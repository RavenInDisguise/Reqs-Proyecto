package com.example.bibliotec.ui

import android.app.AlertDialog
import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.ListView
import android.widget.ProgressBar
import android.widget.TextView
import androidx.lifecycle.lifecycleScope
import androidx.navigation.findNavController
import androidx.navigation.fragment.findNavController
import com.example.bibliotec.R
import com.example.bibliotec.api.ApiRequest
import com.example.bibliotec.user.User
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody

class studListFragment : Fragment() {
    private lateinit var user: User
    private var studentId: Int? = null
    private lateinit var apiRequest: ApiRequest
    private lateinit var progressBar : ProgressBar

    data class Estudiante(
        val id: Int,
        val Nombre: String,
        val carnet: Long,
        val cedula: Int,
        val correo: String,
        val activo: Boolean
    )


    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        user = User.getInstance(requireContext())
        studentId = user.getStudentId()
        apiRequest=ApiRequest.getInstance(requireContext())
        return inflater.inflate(R.layout.fragment_stud_list, container, false)

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val listViewEstudiante: ListView = view.findViewById(R.id.lista_estudiantes)
        val elementos: MutableList<String> = mutableListOf()

        progressBar = view.findViewById(R.id.progressBar)

        viewLifecycleOwner.lifecycleScope.launch{
            withContext(Dispatchers.IO){
                val url = "https://appbibliotec.azurewebsites.net/api/estudiante/estudiantes"
                val (responseStatus, responseString) = apiRequest.getRequest(url)
                if (responseStatus) {
                    val estudianteType = object : TypeToken<List<Estudiante>>() {}.type
                    val estudiantes: List<Estudiante> = Gson().fromJson(responseString, estudianteType)
                    for (estud in estudiantes) {
                        val activo = if (estud.activo) "Activo" else "Inactivo"
                        val elemento = "${estud.Nombre}\n${estud.correo}\n\nID: ${estud.id} \nCarné: ${estud.carnet} \nCédula: ${estud.cedula}\nEstado: $activo"
                        elementos.add(elemento)
                    }
                    val adapter = object : ArrayAdapter<String>(
                        requireContext(),
                        R.layout.admin_list_item_layout,
                        R.id.item_text,
                        elementos
                    ){
                        override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
                            val view = super.getView(position, convertView, parent)

                            val itemText = view.findViewById<TextView>(R.id.item_text)
                            val buttonEditar = view.findViewById<Button>(R.id.button_editar)
                            val buttonReservas = view.findViewById<Button>(R.id.btnReservas)
                            val estudent = estudiantes[position]
                            itemText.text = elementos[position]
                            itemText.setLineSpacing(0f, 1.3f)

                            // Acciones al hacer clic en el botón "Editar"
                            buttonEditar.setOnClickListener {
                                val bundle = Bundle()
                                bundle.putInt("id",estudent.id)
                                view.findNavController().navigate(R.id.action_studListFragment_to_StudentModFragment, bundle)
                            }
                            buttonReservas.setOnClickListener {
                                val bundle = Bundle()
                                bundle.putInt("idEstudiante",estudent.id)
                                view.findNavController().navigate(R.id.action_studList_to_bookingList, bundle)
                            }

                            return view
                        }
                    }
                    withContext(Dispatchers.Main) {
                        listViewEstudiante.adapter = adapter
                        progressBar.visibility = View.GONE
                    }
                } else {
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
}