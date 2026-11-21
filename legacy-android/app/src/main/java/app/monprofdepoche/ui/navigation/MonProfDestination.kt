package app.monprofdepoche.ui.navigation

import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import app.monprofdepoche.R

/**
 * Les cinq espaces principaux, accessibles depuis la barre de navigation.
 * L'enregistrement n'est pas un onglet : c'est une action, ouverte par le
 * bouton central et par le bouton « Nouvel enregistrement » de l'accueil.
 */
enum class MonProfDestination(
    val route: String,
    @StringRes val labelRes: Int,
    @DrawableRes val iconRes: Int,
) {
    Home("home", R.string.nav_home, R.drawable.ic_home),
    Basket("basket", R.string.nav_basket, R.drawable.ic_basket),
    Courses("courses", R.string.nav_courses, R.drawable.ic_book),
    Tutor("tutor", R.string.nav_tutor, R.drawable.ic_chat),
    Progress("progress", R.string.nav_progress, R.drawable.ic_chart),
    ;

    companion object {
        fun fromRoute(route: String?): MonProfDestination? =
            entries.firstOrNull { it.route == route }
    }
}

/** Destinations hors barre de navigation. */
object Routes {
    const val RECORDING = "recording"
}
