package com.example.bibliotec.user

import android.content.Context
import android.content.SharedPreferences
import com.example.bibliotec.api.ApiRequest
import com.google.gson.Gson
import com.google.gson.JsonObject

class User private constructor(context: Context) {
    private val sharedPreferences: SharedPreferences =
        context.getSharedPreferences("UserInfo", Context.MODE_PRIVATE)
    private val gson = Gson()

    private var userId : Int? = sharedPreferences.getIntOrNull("userId")
    private var studentId : Int? = sharedPreferences.getIntOrNull("studentId")
    private var email : String? = sharedPreferences.getString("email", null)
    private var userType : String? = sharedPreferences.getString("userType", null)
    private var timedOut : Boolean = sharedPreferences.getBoolean("timedOut", false)
    private var checkedInCurrentSession = false

    companion object {

        @Volatile
        private var instance: User? = null

        fun getInstance(context : Context) =
            instance ?: synchronized(this) {
                instance ?: User(context).also {
                    instance = it
                }
            }
    }

    fun storeUserInfo(responseString : String) {

        val editor = sharedPreferences.edit()

        val json = gson.fromJson(responseString, JsonObject::class.java)

        if (json.has("userId")) {
            userId = json.get("userId").asInt
            editor.putInt("userId", userId!!)
        }

        if (json.has("idEstudiante")) {
            val idEstudiante = json.get("idEstudiante")
            if (!idEstudiante.isJsonNull) {
                studentId = json.get("idEstudiante").asInt
                editor.putInt("studentId", studentId!!)
            }
        }

        if (json.has("email")) {
            email = json.get("email").asString
            editor.putString("email", email!!)
        }

        if (json.has("tipoUsuario")) {
            userType = json.get("tipoUsuario").asString
            editor.putString("userType", userType!!)
        }

        timedOut = false
        editor.putBoolean("timedOut", false)

        editor.apply()
    }

    fun setTimedOut() {
        timedOut = true
        val editor = sharedPreferences.edit()
        editor.putBoolean("timedOut", true)
        editor.apply()
    }

    fun isLoggedIn() : Boolean {
        return !timedOut && (userId != null)
    }

    fun isAdmin() : Boolean {
        return userType == "Administrador"
    }

    fun SharedPreferences.getIntOrNull(key: String): Int? {
        // Función para retornar un Int solo si existe
        if (contains(key)) {
            return getInt(key, 0) // Retorna el valor almacenado
        }
        return null // Retorna un valor nulo
    }

    fun setCheckedInCurrentSession() {
        checkedInCurrentSession = true
    }

    fun checkedInCurrentSession() : Boolean {
        return checkedInCurrentSession
    }

    fun getStudentId(): Int? {
        return this.studentId
    }

    fun getEmail(): String? {
        return this.email
    }
}