package app.monprofdepoche.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import app.monprofdepoche.domain.model.Subject

/** Couleur d'identité de chaque matière, utilisée par les badges et cartes. */
val Subject.accent: Color
    get() = when (this) {
        Subject.MATHEMATICS -> VioletSoft
        Subject.PHYSICS -> BlueSoft
        Subject.FRENCH -> Amber
        Subject.ENGLISH -> Color(0xFF38BDF8)
        Subject.HISTORY -> Color(0xFFFB923C)
        Subject.GEOGRAPHY -> Color(0xFF2DD4BF)
        Subject.TECHNICAL_DRAWING -> Color(0xFFC084FC)
        Subject.OTHER -> TextSecondary
    }
