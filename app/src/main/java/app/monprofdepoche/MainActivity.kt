package app.monprofdepoche

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import app.monprofdepoche.ui.home.HomeScreen
import app.monprofdepoche.ui.theme.MonProfDePocheTheme

/**
 * Unique activité de l'application pour l'instant : elle affiche
 * l'interface Compose et applique le thème Material 3.
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MonProfDePocheTheme {
                HomeScreen()
            }
        }
    }
}
