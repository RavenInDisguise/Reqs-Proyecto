package com.example.bibliotec.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.CheckBox
import androidx.recyclerview.widget.RecyclerView
import com.example.bibliotec.R
import com.example.bibliotec.data.CheckboxListItem

class FilterAdapter(private val elements : List<CheckboxListItem>) :
    RecyclerView.Adapter<FilterAdapter.ViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.filter_item, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val element = elements[position]
        holder.bind(element)
    }

    override fun getItemCount(): Int {
        return elements.size
    }

    inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val checkbox: CheckBox = itemView.findViewById(R.id.service_filter_checkbox)

        fun bind(element: CheckboxListItem) {
            checkbox.text = element.text
            checkbox.isChecked = element.isChecked

            checkbox.setOnCheckedChangeListener { _, isChecked ->
                element.isChecked = isChecked
            }
        }
    }
}