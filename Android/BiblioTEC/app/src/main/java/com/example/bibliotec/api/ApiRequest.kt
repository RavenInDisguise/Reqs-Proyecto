package com.example.bibliotec.api

import android.content.Context
import com.example.bibliotec.user.User
import com.google.gson.Gson
import com.google.gson.JsonObject
import okhttp3.*
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

class ApiRequest private constructor(context : Context, user : User) {
    private val client = OkHttpClient()
    private val gson = Gson()
    private val context: Context = context
    private val cookieJar = CookieStorage(context)
    private val user: User = user

    companion object {

        @Volatile
        private var instance: ApiRequest? = null

        fun getInstance(context : Context) =
            instance ?: synchronized(this) {
                instance ?: ApiRequest(context, User.getInstance(context)).also {
                    instance = it
                }
            }
    }

    fun getRequest(url: String): Pair<Boolean, String> {
        val httpUrl = url.toHttpUrlOrNull()!!
        val cookies = cookieJar.loadForRequest(httpUrl)
        val request = Request.Builder()
            .url(url)
            .header("Cookie", cookies.joinToString("; "))
            .build()

        val response = client.newCall(request).execute()

        return response.use { response : Response ->
            var responseString = response.body?.string() ?: ""
            var status = true
            if (!response.isSuccessful) {
                status = false

                if (response.code == 403) {
                    responseString = "Su sesión ha expirado"
                    user.setTimedOut()
                } else {
                    responseString = try {
                        val json = gson.fromJson(responseString, JsonObject::class.java)
                        if (json.has("message")) {
                            json.get("message").asString
                        } else {
                            "Error inesperado:\n${response.message}"
                        }
                    } catch (e: Exception) {
                        "Error inesperado"
                    }
                }
            } else {
                if (!response.headers("Set-Cookie").isNullOrEmpty()) {
                    // Se guardan las cookies
                    try {
                        val httpUrl = url.toHttpUrlOrNull()!!
                        val cookies =
                            response.headers("Set-Cookie").mapNotNull { Cookie.parse(httpUrl, it) }
                        cookieJar.saveFromResponse(httpUrl, cookies)
                    } catch (e: Exception) {

                    }
                }
            }
            Pair(status, responseString)
        }
    }

    fun getRequestBytes(url: String): Triple<Boolean, String, ByteArray?> {
        val httpUrl = url.toHttpUrlOrNull()!!
        val cookies = cookieJar.loadForRequest(httpUrl)
        val request = Request.Builder()
            .url(url)
            .header("Cookie", cookies.joinToString("; "))
            .build()

        val response = client.newCall(request).execute()

        return response.use { response : Response ->
            val byteData = response.body?.bytes()
            var responseString : String?
            try {
                responseString = byteData?.let { String(it, Charsets.UTF_8) }
                if (responseString == null) {
                    responseString = ""
                }
            } catch (e : Exception) {
                responseString = ""
            }
            var status = true
            if (!response.isSuccessful) {
                status = false

                if (response.code == 403) {
                    responseString = "Su sesión ha expirado"
                    user.setTimedOut()
                } else {
                    responseString = try {
                        val json = gson.fromJson(responseString, JsonObject::class.java)
                        if (json.has("message")) {
                            json.get("message").asString
                        } else {
                            "Error inesperado:\n${response.message}"
                        }
                    } catch (e: Exception) {
                        "Error inesperado"
                    }
                }
            } else {
                if (!response.headers("Set-Cookie").isNullOrEmpty()) {
                    // Se guardan las cookies
                    try {
                        val httpUrl = url.toHttpUrlOrNull()!!
                        val cookies =
                            response.headers("Set-Cookie").mapNotNull { Cookie.parse(httpUrl, it) }
                        cookieJar.saveFromResponse(httpUrl, cookies)
                    } catch (e: Exception) {

                    }
                }
            }
            Triple(status, responseString!!, byteData)
        }
    }

    fun putRequest(url: String, requestBody: RequestBody): Pair<Boolean, String> {
        val httpUrl = url.toHttpUrlOrNull()!!
        val request = Request.Builder()
            .url(url)
            .header("Cookie", cookieJar.loadForRequest(httpUrl).joinToString("; "))
            .put(requestBody)
            .build()

        val response = client.newCall(request).execute()

        return response.use { response : Response ->
            var responseString = response.body?.string() ?: ""
            var status = true
            if (!response.isSuccessful) {
                status = false

                if (response.code == 403) {
                    responseString = "Su sesión ha expirado"
                    user.setTimedOut()
                } else {
                    responseString = try {
                        val json = gson.fromJson(responseString, JsonObject::class.java)
                        if (json.has("message")) {
                            json.get("message").asString
                        } else {
                            "Error inesperado:\n${response.message}"
                        }
                    } catch (e: Exception) {
                        "Error inesperado"
                    }
                }
            } else {
                if (!response.headers("Set-Cookie").isNullOrEmpty()) {
                    // Se guardan las cookies
                    try {
                        val httpUrl = url.toHttpUrlOrNull()!!
                        val cookies =
                            response.headers("Set-Cookie").mapNotNull { Cookie.parse(httpUrl, it) }
                        cookieJar.saveFromResponse(httpUrl, cookies)
                    } catch (e: Exception) {

                    }
                }
            }
            Pair(status, responseString)
        }
    }

    fun postRequest(url: String, requestBody: RequestBody): Pair<Boolean, String> {
        val httpUrl = url.toHttpUrlOrNull()!!
        val request = Request.Builder()
            .url(url)
            .header("Cookie", cookieJar.loadForRequest(httpUrl).joinToString("; "))
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

                if (response.code == 403) {
                    responseString = "Su sesión ha expirado"
                    user.setTimedOut()
                } else {
                    responseString = try {
                        val json = gson.fromJson(responseString, JsonObject::class.java)
                        if (json.has("message")) {
                            json.get("message").asString
                        } else {
                            "Error inesperado:\n${response.message}"
                        }
                    } catch (e: Exception) {
                        "Error inesperado"
                    }
                }
            } else {
                if (!response.headers("Set-Cookie").isNullOrEmpty()) {
                    // Se guardan las cookies
                    try {
                        val httpUrl = url.toHttpUrlOrNull()!!
                        val cookies =
                            response.headers("Set-Cookie").mapNotNull { Cookie.parse(httpUrl, it) }
                        cookieJar.saveFromResponse(httpUrl, cookies)
                    } catch (e: Exception) {

                    }
                }
            }
            Pair(status, responseString)
        }
    }
}
