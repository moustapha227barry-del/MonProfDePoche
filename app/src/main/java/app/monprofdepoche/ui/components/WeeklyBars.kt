package app.monprofdepoche.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.unit.dp
import app.monprofdepoche.ui.theme.Green
import app.monprofdepoche.ui.theme.GreenSoft
import app.monprofdepoche.ui.theme.Violet
import app.monprofdepoche.ui.theme.VioletSoft

/**
 * Histogramme hebdomadaire dessiné directement (aucune bibliothèque de
 * graphiques) : barres arrondies violettes, jour courant en vert.
 */
@Composable
fun WeeklyBars(
    values: List<Int>,
    highlightIndex: Int,
    modifier: Modifier = Modifier,
) {
    val maxValue = values.maxOrNull()?.coerceAtLeast(1) ?: 1

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(96.dp),
    ) {
        if (values.isEmpty()) return@Canvas

        val gap = 10.dp.toPx()
        val barWidth = ((size.width - gap * (values.size - 1)) / values.size).coerceAtLeast(1f)

        values.forEachIndexed { index, value ->
            val ratio = value.toFloat() / maxValue
            val barHeight = (size.height * ratio).coerceAtLeast(6.dp.toPx())
            val topLeft = Offset(
                x = index * (barWidth + gap),
                y = size.height - barHeight,
            )
            val brush = if (index == highlightIndex) {
                Brush.verticalGradient(listOf(GreenSoft, Green))
            } else {
                Brush.verticalGradient(listOf(VioletSoft.copy(alpha = 0.9f), Violet.copy(alpha = 0.3f)))
            }

            drawRoundRect(
                brush = brush,
                topLeft = topLeft,
                size = Size(barWidth, barHeight),
                cornerRadius = CornerRadius(barWidth / 2f),
            )
        }
    }
}
