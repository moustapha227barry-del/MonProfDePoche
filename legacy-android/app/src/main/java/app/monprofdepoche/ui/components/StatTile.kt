package app.monprofdepoche.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import app.monprofdepoche.ui.theme.TextSecondary

/** Petite tuile de chiffre clé : valeur colorée, libellé discret, point d'accent. */
@Composable
fun StatTile(
    value: String,
    label: String,
    accent: Color,
    modifier: Modifier = Modifier,
) {
    MonProfCard(
        modifier = modifier,
        contentPadding = PaddingValues(14.dp),
    ) {
        Box(
            modifier = Modifier
                .size(width = 18.dp, height = 3.dp)
                .clip(CircleShape)
                .background(accent),
        )
        Spacer(Modifier.height(10.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.headlineSmall,
            color = accent,
        )
        Spacer(Modifier.height(2.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = TextSecondary,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

