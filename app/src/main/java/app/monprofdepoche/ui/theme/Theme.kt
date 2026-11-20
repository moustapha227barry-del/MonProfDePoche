package app.monprofdepoche.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

private val MonProfColorScheme = darkColorScheme(
    primary = Violet,
    onPrimary = Color.White,
    primaryContainer = Color(0xFF2A1E52),
    onPrimaryContainer = Color(0xFFEDE9FE),
    secondary = Blue,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFF172554),
    onSecondaryContainer = Color(0xFFDBEAFE),
    tertiary = Green,
    onTertiary = Color(0xFF052E1F),
    tertiaryContainer = Color(0xFF103B2C),
    onTertiaryContainer = Color(0xFFD1FAE5),
    background = Ink,
    onBackground = TextPrimary,
    surface = SurfaceCard,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceCardHigh,
    onSurfaceVariant = TextSecondary,
    outline = CardBorder,
    outlineVariant = SurfaceCardHigh,
    error = Coral,
    onError = Color(0xFF2B0A0A),
    scrim = Color(0xCC000000),
)

private val MonProfShapes = Shapes(
    extraSmall = RoundedCornerShape(10.dp),
    small = RoundedCornerShape(14.dp),
    medium = RoundedCornerShape(20.dp),
    large = RoundedCornerShape(26.dp),
    extraLarge = RoundedCornerShape(32.dp),
)

/**
 * Thème unique de l'application : identité sombre imposée, quel que soit le
 * réglage clair/sombre du téléphone. C'est un choix de direction artistique,
 * pas un oubli.
 */
@Composable
fun MonProfDePocheTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = MonProfColorScheme,
        typography = Typography,
        shapes = MonProfShapes,
        content = content,
    )
}
