package com.example.bibliotec

import okhttp3.*
import java.io.IOException

class ApiRequest {
    private val client = OkHttpClient()

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
}
