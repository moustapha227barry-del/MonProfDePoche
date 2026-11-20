package app.monprofdepoche.ui.navigation

import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController

/**
 * Change d'onglet sans empiler les écrans : l'état de chaque onglet est
 * conservé, comme dans les applications natives modernes.
 */
fun NavHostController.openTab(destination: MonProfDestination) {
    navigate(destination.route) {
        popUpTo(graph.findStartDestination().id) {
            saveState = true
        }
        launchSingleTop = true
        restoreState = true
    }
}
