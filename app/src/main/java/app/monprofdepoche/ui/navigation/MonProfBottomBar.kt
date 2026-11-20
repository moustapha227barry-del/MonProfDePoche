package app.monprofdepoche.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.monprofdepoche.R
import app.monprofdepoche.ui.theme.Blue
import app.monprofdepoche.ui.theme.Green
import app.monprofdepoche.ui.theme.InkElevated
import app.monprofdepoche.ui.theme.TextMuted
import app.monprofdepoche.ui.theme.TextPrimary
import app.monprofdepoche.ui.theme.Violet
import app.monprofdepoche.ui.theme.VioletSoft

/**
 * Barre de navigation sur mesure : cinq espaces de consultation et, au centre,
 * le bouton d'enregistrement légèrement surélevé. Le bouton fait partie de la
 * barre (et non d'un bouton flottant) pour ne jamais recouvrir le contenu.
 */
@Composable
fun MonProfBottomBar(
    current: MonProfDestination?,
    onSelect: (MonProfDestination) -> Unit,
    onRecord: () -> Unit,
    isRecording: Boolean = false,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(InkElevated)
            .navigationBarsPadding()
            .padding(horizontal = 6.dp, vertical = 6.dp)
            .height(64.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BottomBarItem(MonProfDestination.Home, current, onSelect, Modifier.weight(1f))
        BottomBarItem(MonProfDestination.Basket, current, onSelect, Modifier.weight(1f))
        RecordDockButton(
            isActive = isRecording,
            onClick = onRecord,
            modifier = Modifier.weight(1f),
        )
        BottomBarItem(MonProfDestination.Courses, current, onSelect, Modifier.weight(1f))
        BottomBarItem(MonProfDestination.Tutor, current, onSelect, Modifier.weight(1f))
        BottomBarItem(MonProfDestination.Progress, current, onSelect, Modifier.weight(1f))
    }
}

@Composable
private fun BottomBarItem(
    destination: MonProfDestination,
    current: MonProfDestination?,
    onSelect: (MonProfDestination) -> Unit,
    modifier: Modifier = Modifier,
) {
    val selected = current == destination
    Column(
        modifier = modifier
            .fillMaxHeight()
            .clickable { onSelect(destination) },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(
            modifier = Modifier
                .size(width = 40.dp, height = 26.dp)
                .clip(RoundedCornerShape(50))
                .background(if (selected) Violet.copy(alpha = 0.18f) else Color.Transparent),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                painter = painterResource(destination.iconRes),
                contentDescription = null,
                tint = if (selected) VioletSoft else TextMuted,
                modifier = Modifier.size(20.dp),
            )
        }
        Spacer(Modifier.height(3.dp))
        Text(
            text = stringResource(destination.labelRes),
            style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
            color = if (selected) TextPrimary else TextMuted,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(horizontal = 1.dp),
        )
    }
}

@Composable
private fun RecordDockButton(
    isActive: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier,
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .offset(y = (-6).dp)
                .size(54.dp)
                .shadow(elevation = 12.dp, shape = CircleShape, ambientColor = Violet, spotColor = Blue)
                .clip(CircleShape)
                .background(
                    Brush.linearGradient(
                        if (isActive) listOf(Green, Blue) else listOf(Violet, Blue),
                    ),
                )
                .clickable(onClick = onClick),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                painter = painterResource(R.drawable.ic_mic),
                contentDescription = stringResource(R.string.record_cta),
                tint = Color.White,
                modifier = Modifier.size(24.dp),
            )
        }
    }
}
