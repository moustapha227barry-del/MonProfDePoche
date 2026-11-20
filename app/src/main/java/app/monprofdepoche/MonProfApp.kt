package app.monprofdepoche

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import app.monprofdepoche.ui.navigation.MonProfBottomBar
import app.monprofdepoche.ui.navigation.MonProfDestination
import app.monprofdepoche.ui.navigation.MonProfNavHost
import app.monprofdepoche.ui.navigation.Routes
import app.monprofdepoche.ui.navigation.openTab
import app.monprofdepoche.ui.theme.MonProfDePocheTheme

/**
 * Racine de l'interface : thème, barre de navigation avec le bouton
 * d'enregistrement central, et hôte de tous les écrans.
 */
@Composable
fun MonProfApp() {
    MonProfDePocheTheme {
        val navController = rememberNavController()
        val backStackEntry by navController.currentBackStackEntryAsState()
        val currentRoute = backStackEntry?.destination?.route
        val currentTab = MonProfDestination.fromRoute(currentRoute)

        Scaffold(
            containerColor = MaterialTheme.colorScheme.background,
            bottomBar = {
                MonProfBottomBar(
                    current = currentTab,
                    onSelect = { destination -> navController.openTab(destination) },
                    onRecord = { navController.navigate(Routes.RECORDING) },
                    isRecording = currentRoute == Routes.RECORDING,
                )
            },
        ) { innerPadding ->
            MonProfNavHost(
                navController = navController,
                modifier = Modifier.padding(innerPadding),
            )
        }
    }
}
