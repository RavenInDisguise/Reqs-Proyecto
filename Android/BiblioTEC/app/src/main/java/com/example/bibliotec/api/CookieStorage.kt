package com.example.bibliotec.api

import android.content.Context
import android.content.SharedPreferences
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.internal.toImmutableList

class CookieStorage(context: Context) : CookieJar {
    private val sharedPreferences: SharedPreferences =
        context.getSharedPreferences("CookieStorage", Context.MODE_PRIVATE)

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        sharedPreferences.edit().apply {
            putStringSet(url.host, cookies.map { it.toString() }.toSet())
            apply()
        }
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val cookieStrings = sharedPreferences.getStringSet(url.host, emptySet())
        return cookieStrings?.mapNotNull { Cookie.parse(url, it) }?.toImmutableList() ?: emptyList()
    }
}
