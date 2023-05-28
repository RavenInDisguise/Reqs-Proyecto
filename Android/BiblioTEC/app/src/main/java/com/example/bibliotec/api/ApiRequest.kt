package com.example.bibliotec.api

import android.app.Activity
import android.content.Context
import okhttp3.*
import java.io.IOException
import com.google.gson.Gson
import com.google.gson.JsonObject

class ApiRequest {
    private val client = OkHttpClient()
    private val gson = Gson()

    fun getRequest(url: String): String {
        val request = Request.Builder()
            .url(url)
            .build()

        val response = client.newCall(request).execute()

        return response.use { response : Response ->
            if (!response.isSuccessful) throw IOException("Unexpected code $response")
            response.body?.string() ?: ""
        }
    }

    fun putRequest(url: String, requestBody: RequestBody): String {
        val request = Request.Builder()
            .url(url)
            .put(requestBody)
            .build()

        val response = client.newCall(request).execute()

        return response.use { response : Response ->
            if (!response.isSuccessful) throw IOException("Unexpected code $response")
            response.body?.string() ?: ""
        }
    }

    fun postRequest(url: String, requestBody: RequestBody): Pair<Boolean, String> {
        val request = Request.Builder()
            .url(url)
            .post(requestBody)
            .build()

        var response : Response

        try {
            response = client.newCall(request).execute()
        } catch (e: Exception) {
            return Pair(false, "Error de red")
        }

        return response.use { response : Response ->
            var responseString = response.body?.string() ?: ""
            var status = true
            if (!response.isSuccessful) {
                status = false
                try {
                    val json = gson.fromJson(responseString, JsonObject::class.java)
                    responseString = if (json.has("message")) {
                        json.get("message").asString
                    } else {
                        "Error inesperado:\n${response.message}"
                    }
                } catch (e: Exception) {
                    responseString = "Error inesperado"
                }
            }
            Pair(status, responseString)
        }
    }
}
