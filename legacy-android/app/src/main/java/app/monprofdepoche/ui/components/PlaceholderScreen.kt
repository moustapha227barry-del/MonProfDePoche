package app.monprofdepoche.ui.components

import androidx.annotation.DrawableRes
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import app.monprofdepoche.R
import app.monprofdepoche.ui.theme.Blue
import app.monprofdepoche.ui.theme.CardBorder
import app.monprofdepoche.ui.theme.Green
import app.monprofdepoche.ui.theme.SurfaceCardHigh
import app.monprofdepoche.ui.theme.TextSecondary
import app.monprofdepoche.ui.theme.Violet
import app.monprofdepoche.ui.theme.VioletSoft

/**
 * Écran d'attente pour les espaces qui seront développés dans les phases
 * suivantes. Il présente le contenu prévu sans simuler de fausses
 * fonctionnalités : aucun bouton inactif, aucune donnée trompeuse.
 */
@Composable
fun PlaceholderScreen(
    @DrawableRes iconRes: Int,
    title: String,
    subtitle: String,
    features: List<String>,
    modifier: Modifier = Modifier,
    onBack: (() -> Unit)? = null,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 12.dp),
    ) {
        if (onBack != null) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(SurfaceCardHigh)
                    .border(1.dp, CardBorder, CircleShape)
                    .clickable(onClick = onBack),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    painter = painterResource(R.drawable.ic_back),
                    contentDescription = stringResource(R.string.action_back),
                    tint = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.size(18.dp),
                )
            }
            Spacer(Modifier.height(24.dp))
        }

        Box(
            modifier = Modifier
                .size(76.dp)
                .clip(RoundedCornerShape(26.dp))
                .background(Brush.linearGradient(listOf(Violet, Blue))),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                painter = painterResource(iconRes),
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(34.dp),
            )
        }

        Spacer(Modifier.height(20.dp))

        Text(
            text = title,
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground,
        )

        Spacer(Modifier.height(8.dp))

        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodyLarge,
            color = TextSecondary,
        )

        Spacer(Modifier.height(24.dp))

        MonProfCard(
            modifier = Modifier.fillMaxWidth(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(50))
                        .background(VioletSoft.copy(alpha = 0.16f))
                        .padding(horizontal = 10.dp, vertical = 5.dp),
                ) {
                    Text(
                        text = stringResource(R.string.placeholder_badge),
                        style = MaterialTheme.typography.labelSmall,
                        color = VioletSoft,
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            features.forEach { feature ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    verticalAlignment = Alignment.Top,
                ) {
                    Box(
                        modifier = Modifier
                            .padding(top = 6.dp)
                            .size(6.dp)
                            .clip(CircleShape)
                            .background(Green),
                    )
                    Spacer(Modifier.width(12.dp))
                    Text(
                        text = feature,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary,
                    )
                }
            }
        }

        Spacer(Modifier.height(80.dp))
    }
}
