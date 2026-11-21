package app.monprofdepoche.ui.home

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import app.monprofdepoche.R
import app.monprofdepoche.domain.model.Subject
import app.monprofdepoche.ui.components.GradientButton
import app.monprofdepoche.ui.components.MonProfCard
import app.monprofdepoche.ui.components.SectionHeader
import app.monprofdepoche.ui.components.StatTile
import app.monprofdepoche.ui.components.WeeklyBars
import app.monprofdepoche.ui.format.formatDuration
import app.monprofdepoche.ui.theme.Amber
import app.monprofdepoche.ui.theme.Blue
import app.monprofdepoche.ui.theme.BlueSoft
import app.monprofdepoche.ui.theme.CardBorder
import app.monprofdepoche.ui.theme.Green
import app.monprofdepoche.ui.theme.GreenSoft
import app.monprofdepoche.ui.theme.MonProfDePocheTheme
import app.monprofdepoche.ui.theme.SurfaceCard
import app.monprofdepoche.ui.theme.SurfaceCardHigh
import app.monprofdepoche.ui.theme.TextMuted
import app.monprofdepoche.ui.theme.TextPrimary
import app.monprofdepoche.ui.theme.TextSecondary
import app.monprofdepoche.ui.theme.Violet
import app.monprofdepoche.ui.theme.VioletDeep
import app.monprofdepoche.ui.theme.VioletSoft
import app.monprofdepoche.ui.theme.accent
import kotlin.math.roundToInt

@Composable
fun HomeScreen(
    onStartRecording: () -> Unit,
    onOpenBasket: () -> Unit,
    onOpenCourses: () -> Unit,
    onOpenProgress: () -> Unit,
    modifier: Modifier = Modifier,
    state: HomeUiState = DemoHomeState.state,
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 8.dp, bottom = 120.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item { HomeHeader(streakDays = state.streakDays) }
        item { DailyGoalCard(state = state) }
        item {
            GradientButton(
                text = stringResource(R.string.record_cta),
                iconRes = R.drawable.ic_mic,
                onClick = onStartRecording,
            )
        }
        item { StatsRow(state = state) }
        item { WeekActivityCard(state = state) }

        item {
            SectionHeader(
                title = stringResource(R.string.recent_courses),
                actionLabel = stringResource(R.string.see_all),
                onAction = onOpenCourses,
                modifier = Modifier.padding(top = 6.dp),
            )
        }
        items(state.recentCourses) { course ->
            RecentCourseCard(course = course)
        }

        item { PendingAnalysisCard(pendingAnalyses = state.pendingAnalyses, onOpenBasket = onOpenBasket) }
        item { RevisionCard(revision = state.revision, onOpenProgress = onOpenProgress) }

        item {
            Text(
                text = stringResource(R.string.demo_notice),
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp),
            )
        }
    }
}

// ---------------------------------------------------------------------------
// En-tête
// ---------------------------------------------------------------------------

@Composable
private fun HomeHeader(streakDays: Int) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = stringResource(R.string.greeting),
                style = MaterialTheme.typography.labelLarge,
                color = TextSecondary,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = stringResource(R.string.greeting_title),
                style = MaterialTheme.typography.headlineSmall,
                color = TextPrimary,
            )
        }

        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(50))
                .background(SurfaceCardHigh)
                .border(1.dp, CardBorder, RoundedCornerShape(50))
                .padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(text = "🔥", style = MaterialTheme.typography.labelMedium)
            Spacer(Modifier.width(5.dp))
            Text(
                text = stringResource(R.string.streak_days, streakDays),
                style = MaterialTheme.typography.labelMedium,
                color = Amber,
            )
        }

        Spacer(Modifier.width(10.dp))

        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(Brush.linearGradient(listOf(Violet, Blue))),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "M",
                style = MaterialTheme.typography.titleMedium,
                color = Color.White,
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Objectif du jour
// ---------------------------------------------------------------------------

@Composable
private fun DailyGoalCard(state: HomeUiState) {
    val shape = RoundedCornerShape(28.dp)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(shape)
            .background(Brush.linearGradient(listOf(VioletDeep, Violet, Blue))),
    ) {
        // Halos décoratifs pour donner de la profondeur au dégradé.
        Canvas(modifier = Modifier.matchParentSize()) {
            drawCircle(
                color = Color.White.copy(alpha = 0.08f),
                radius = size.minDimension * 0.55f,
                center = Offset(size.width * 0.92f, size.height * 0.05f),
            )
            drawCircle(
                color = Green.copy(alpha = 0.12f),
                radius = size.minDimension * 0.4f,
                center = Offset(size.width * 0.05f, size.height * 0.98f),
            )
        }

        Column(modifier = Modifier.padding(22.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = stringResource(R.string.goal_title),
                    style = MaterialTheme.typography.labelLarge,
                    color = Color.White.copy(alpha = 0.85f),
                    modifier = Modifier.weight(1f),
                )
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(50))
                        .background(Color.White.copy(alpha = 0.16f))
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                ) {
                    Text(
                        text = stringResource(
                            R.string.goal_percent,
                            (state.goalProgress * 100).roundToInt(),
                        ),
                        style = MaterialTheme.typography.labelMedium,
                        color = Color.White,
                    )
                }
            }

            Spacer(Modifier.height(10.dp))

            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = formatDuration(state.recordedMinutes),
                    style = MaterialTheme.typography.displaySmall,
                    color = Color.White,
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = stringResource(R.string.goal_of, formatDuration(state.goalMinutes)),
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.72f),
                    modifier = Modifier.padding(bottom = 5.dp),
                )
            }

            Spacer(Modifier.height(16.dp))

            GoalProgressBar(progress = state.goalProgress)

            Spacer(Modifier.height(14.dp))

            Text(
                text = stringResource(
                    R.string.goal_summary,
                    state.coursesToday,
                    state.pendingAnalyses,
                ),
                style = MaterialTheme.typography.labelMedium,
                color = Color.White.copy(alpha = 0.85f),
            )
        }
    }
}

@Composable
private fun GoalProgressBar(progress: Float) {
    Canvas(
        modifier = Modifier
            .fillMaxWidth()
            .height(10.dp),
    ) {
        val radius = CornerRadius(size.height / 2f)
        drawRoundRect(
            color = Color.White.copy(alpha = 0.18f),
            size = size,
            cornerRadius = radius,
        )
        if (progress > 0f) {
            drawRoundRect(
                brush = Brush.horizontalGradient(listOf(Color.White, GreenSoft)),
                size = Size(size.width * progress, size.height),
                cornerRadius = radius,
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Chiffres clés et activité
// ---------------------------------------------------------------------------

@Composable
private fun StatsRow(state: HomeUiState) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        StatTile(
            value = state.coursesToday.toString(),
            label = stringResource(R.string.stats_courses),
            accent = VioletSoft,
            modifier = Modifier.weight(1f),
        )
        StatTile(
            value = state.pendingAnalyses.toString(),
            label = stringResource(R.string.stats_pending),
            accent = BlueSoft,
            modifier = Modifier.weight(1f),
        )
        StatTile(
            value = state.revisionsDue.toString(),
            label = stringResource(R.string.stats_reviews),
            accent = Green,
            modifier = Modifier.weight(1f),
        )
    }
}

@Composable
private fun WeekActivityCard(state: HomeUiState) {
    MonProfCard(modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = stringResource(R.string.week_title),
                    style = MaterialTheme.typography.titleMedium,
                    color = TextPrimary,
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    text = formatDuration(state.weekTotalMinutes),
                    style = MaterialTheme.typography.labelMedium,
                    color = TextSecondary,
                )
            }
            Text(
                text = stringResource(R.string.week_days_count, state.weekMinutes.count { it > 0 }),
                style = MaterialTheme.typography.labelMedium,
                color = GreenSoft,
            )
        }

        Spacer(Modifier.height(18.dp))

        WeeklyBars(values = state.weekMinutes, highlightIndex = state.todayIndex)

        Spacer(Modifier.height(10.dp))

        Row(modifier = Modifier.fillMaxWidth()) {
            listOf("L", "M", "M", "J", "V", "S", "D").forEach { day ->
                Text(
                    text = day,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Cours récents
// ---------------------------------------------------------------------------

@Composable
private fun RecentCourseCard(course: RecentCourse) {
    MonProfCard(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(16.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(course.subject.accent.copy(alpha = 0.16f)),
                contentAlignment = Alignment.Center,
            ) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(course.subject.accent),
                )
            }

            Spacer(Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = course.title,
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f),
                    )
                    Spacer(Modifier.width(8.dp))
                    StatusChip(analysed = course.analysed)
                }
                Spacer(Modifier.height(3.dp))
                Text(
                    text = course.chapter,
                    style = MaterialTheme.typography.labelMedium,
                    color = TextSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = stringResource(
                        R.string.course_meta,
                        stringResource(course.subject.labelRes),
                        formatDuration(course.durationMinutes),
                        course.timeLabel,
                    ),
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

@Composable
private fun StatusChip(analysed: Boolean) {
    val color = if (analysed) Green else BlueSoft
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(color.copy(alpha = 0.14f))
            .padding(horizontal = 10.dp, vertical = 5.dp),
    ) {
        Text(
            text = stringResource(
                if (analysed) R.string.status_analysed else R.string.status_pending,
            ),
            style = MaterialTheme.typography.labelSmall,
            color = color,
            maxLines = 1,
        )
    }
}

// ---------------------------------------------------------------------------
// Analyses en attente et révisions
// ---------------------------------------------------------------------------

@Composable
private fun PendingAnalysisCard(pendingAnalyses: Int, onOpenBasket: () -> Unit) {
    MonProfCard(
        modifier = Modifier.fillMaxWidth(),
        borderColor = Blue.copy(alpha = 0.35f),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(Blue.copy(alpha = 0.16f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    painter = painterResource(R.drawable.ic_basket),
                    contentDescription = null,
                    tint = BlueSoft,
                    modifier = Modifier.size(22.dp),
                )
            }

            Spacer(Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = stringResource(R.string.pending_title, pendingAnalyses),
                    style = MaterialTheme.typography.titleMedium,
                    color = TextPrimary,
                )
                Spacer(Modifier.height(3.dp))
                Text(
                    text = stringResource(R.string.pending_body),
                    style = MaterialTheme.typography.labelMedium,
                    color = TextSecondary,
                )
            }
        }

        TextButton(
            onClick = onOpenBasket,
            colors = ButtonDefaults.textButtonColors(contentColor = BlueSoft),
            contentPadding = PaddingValues(horizontal = 0.dp, vertical = 4.dp),
        ) {
            Text(
                text = stringResource(R.string.open_basket),
                style = MaterialTheme.typography.labelLarge,
            )
        }
    }
}

@Composable
private fun RevisionCard(revision: RevisionReminder, onOpenProgress: () -> Unit) {
    val shape = RoundedCornerShape(24.dp)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(shape)
            .background(Brush.linearGradient(listOf(Green.copy(alpha = 0.55f), Violet.copy(alpha = 0.45f))))
            .padding(1.dp)
            .clip(shape)
            .background(SurfaceCard),
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Text(
                text = stringResource(R.string.revision_label),
                style = MaterialTheme.typography.labelSmall,
                color = GreenSoft,
            )

            Spacer(Modifier.height(8.dp))

            Text(
                text = revision.notion,
                style = MaterialTheme.typography.titleLarge,
                color = TextPrimary,
            )

            Spacer(Modifier.height(4.dp))

            Text(
                text = stringResource(
                    R.string.revision_meta,
                    stringResource(revision.subject.labelRes),
                    revision.lastSeenLabel,
                ),
                style = MaterialTheme.typography.labelMedium,
                color = TextSecondary,
            )

            Spacer(Modifier.height(14.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(6.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.08f)),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(revision.masteryPercent / 100f)
                            .height(6.dp)
                            .clip(CircleShape)
                            .background(Brush.horizontalGradient(listOf(GreenSoft, Green))),
                    )
                }
                Spacer(Modifier.width(10.dp))
                Text(
                    text = stringResource(R.string.revision_mastery, revision.masteryPercent),
                    style = MaterialTheme.typography.labelSmall,
                    color = GreenSoft,
                )
            }

            TextButton(
                onClick = onOpenProgress,
                colors = ButtonDefaults.textButtonColors(contentColor = GreenSoft),
                contentPadding = PaddingValues(horizontal = 0.dp, vertical = 4.dp),
            ) {
                Text(
                    text = stringResource(R.string.resume_revisions),
                    style = MaterialTheme.typography.labelLarge,
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Aperçu dans Android Studio
// ---------------------------------------------------------------------------

@Preview(showBackground = true, backgroundColor = 0xFF08080F, widthDp = 390, heightDp = 900)
@Composable
private fun HomeScreenPreview() {
    MonProfDePocheTheme {
        HomeScreen(
            onStartRecording = {},
            onOpenBasket = {},
            onOpenCourses = {},
            onOpenProgress = {},
        )
    }
}
