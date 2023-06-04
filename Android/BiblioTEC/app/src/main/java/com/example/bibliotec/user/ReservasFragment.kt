package com.example.bibliotec.user

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
import android.widget.TextView
import com.example.bibliotec.R
import com.google.gson.Gson
import com.google.gson.JsonObject


class ReservasFragment : Fragment() {
    private lateinit var sharedPreferences: SharedPreferences
    private val gson = Gson()
    private var studentId: Int? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
//            param1 = it.getString(ARG_PARAM1)
//            param2 = it.getString(ARG_PARAM2)
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inicializar sharedPreferences y studentId dentro de onCreateView
        sharedPreferences = requireContext().getSharedPreferences("UserInfo", Context.MODE_PRIVATE)
        studentId = sharedPreferences.getIntOrNull("studentId")

        val view = inflater.inflate(R.layout.fragment_reservas, container, false)

        val listViewReservas: ListView = view.findViewById(R.id.reserv_list)

        val elementos: MutableList<String> = mutableListOf("Elemento 1", "Elemento 2", "Elemento 3")

        elementos.add(studentId.toString());

        val adapter = object : ArrayAdapter<String>(
            requireContext(),
            R.layout.list_item_layout,
            R.id.item_text,
            elementos
        ) {
            override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
                val view = super.getView(position, convertView, parent)

                val itemText = view.findViewById<TextView>(R.id.item_text)
                val buttonConfirmar = view.findViewById<Button>(R.id.button_confirmar)
                val buttonEliminar = view.findViewById<Button>(R.id.button_eliminar)

                // Acciones al hacer clic en el botón Confirmar
                buttonConfirmar.setOnClickListener {
                    // Acción al confirmar el elemento en la posición "position"
                }

                // Acciones al hacer clic en el botón Eliminar
                buttonEliminar.setOnClickListener {
                    // Acción al eliminar el elemento en la posición "position"
                }

                return view
            }
        }

        listViewReservas.adapter = adapter

        return view
    }


    private fun SharedPreferences.getIntOrNull(key: String): Int? {
        // Función para retornar un Int solo si existe
        if (contains(key)) {
            return getInt(key, 0) // Retorna el valor almancenado
        }
        return null // Retorna un valor nulo
    }
}