package com.example.bibliotec.misc

import java.text.DateFormat
import java.text.SimpleDateFormat
import java.util.*

class LocalDate {
    companion object {
        fun dateTime(dateTime: Date, includeSeconds: Boolean = false, fullDate : Boolean = false): String {
            val dateFormat = DateFormat.getDateInstance(
                if (fullDate) DateFormat.FULL else DateFormat.MEDIUM
            )
            val timeFormat = DateFormat.getTimeInstance(
                if (includeSeconds) DateFormat.MEDIUM else DateFormat.SHORT
            )
            dateFormat.timeZone = TimeZone.getDefault()
            timeFormat.timeZone = TimeZone.getDefault()
            return "${dateFormat.format(dateTime)}, ${timeFormat.format(dateTime)}"
        }

        fun dateTime(dateTime: String, isIso: Boolean, includeSeconds: Boolean = false, fullDate : Boolean = false): String {
            val dateTimeObject = if (isIso) parseIso(dateTime) else parseUtc(dateTime)
            val dateFormat = DateFormat.getDateInstance(
                if (fullDate) DateFormat.FULL else DateFormat.MEDIUM
            )
            val timeFormat = DateFormat.getTimeInstance(
                if (includeSeconds) DateFormat.MEDIUM else DateFormat.SHORT
            )
            dateFormat.timeZone = TimeZone.getDefault()
            timeFormat.timeZone = TimeZone.getDefault()
            return "${dateFormat.format(dateTimeObject)}, ${timeFormat.format(dateTimeObject)}"
        }

        fun date(date: Date, fullDate : Boolean = false): String {
            val dateFormat = DateFormat.getDateInstance(if (fullDate) DateFormat.FULL else DateFormat.MEDIUM)
            dateFormat.timeZone = TimeZone.getDefault()
            return dateFormat.format(date)
        }

        fun date(date: String, isIso: Boolean, fullDate : Boolean = false): String {
            val dateObject = if (isIso) parseIso(date) else parseUtc(date)
            val dateFormat = DateFormat.getDateInstance(if (fullDate) DateFormat.FULL else DateFormat.MEDIUM)
            dateFormat.timeZone = TimeZone.getDefault()
            return dateFormat.format(dateObject)
        }

        fun time(time: Date, includeSeconds: Boolean = false): String {
            val dateFormat =
                DateFormat.getTimeInstance(if (includeSeconds) DateFormat.MEDIUM else DateFormat.SHORT)
            dateFormat.timeZone = TimeZone.getDefault()
            return dateFormat.format(time)
        }

        fun time(time: String, isIso: Boolean, includeSeconds: Boolean = false): String {
            val timeObject = if (isIso) parseIso(time) else parseUtc(time)
            val dateFormat =
                DateFormat.getTimeInstance(if (includeSeconds) DateFormat.MEDIUM else DateFormat.SHORT)
            dateFormat.timeZone = TimeZone.getDefault()
            return dateFormat.format(timeObject)
        }

        fun parseUtc(utcString: String): Date {
            val sourceFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
            sourceFormat.timeZone = TimeZone.getTimeZone("UTC")
            return sourceFormat.parse(utcString)
        }

        fun parseIso(utcString: String): Date {
            val sourceFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
            sourceFormat.timeZone = TimeZone.getTimeZone("UTC")
            return sourceFormat.parse(utcString)
        }

        fun toUtc(calendar : Calendar): String {
            val dateformat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
            dateformat.timeZone = TimeZone.getTimeZone("UTC")
            return dateformat.format(calendar.time)
        }

        fun toUtc(date : Date): String {
            val dateformat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
            dateformat.timeZone = TimeZone.getTimeZone("UTC")
            return dateformat.format(date)
        }

        fun toIso(calendar : Calendar): String {
            val dateformat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            dateformat.timeZone = TimeZone.getTimeZone("UTC")
            return dateformat.format(calendar.time)
        }

        fun toIso(date : Date): String {
            val dateformat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            dateformat.timeZone = TimeZone.getTimeZone("UTC")
            return dateformat.format(date)
        }

        fun durationString(duration : Int): String {
            var resultingString = ""

            if (duration >= 60) {
                resultingString = (duration / 60).toString() + " h"
            }

            if (duration % 60 > 0) {
                if (!resultingString.isEmpty()) {
                    resultingString += " "
                }
                resultingString += (duration % 60).toString() + " min"
            }

            if (resultingString.isEmpty()) {
                resultingString = "0 min"
            }

            return resultingString
        }
    }
}