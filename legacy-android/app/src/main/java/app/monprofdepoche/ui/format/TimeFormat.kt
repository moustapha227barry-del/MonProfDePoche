package app.monprofdepoche.ui.format

/** Affiche une durée en minutes sous une forme lisible : « 45 min », « 2 h 15 ». */
fun formatDuration(minutes: Int): String {
    if (minutes < 60) return "$minutes min"
    val hours = minutes / 60
    val remaining = minutes % 60
    return if (remaining == 0) "$hours h" else "$hours h ${remaining.toString().padStart(2, '0')}"
}
