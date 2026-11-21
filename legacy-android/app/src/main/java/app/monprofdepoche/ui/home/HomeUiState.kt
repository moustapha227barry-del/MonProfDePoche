package app.monprofdepoche.ui.home

import app.monprofdepoche.domain.model.Subject

/**
 * Données affichées par l'écran d'accueil.
 *
 * ATTENTION : pour cette étape, les valeurs viennent de [DemoHomeState].
 * Ce sont des données de démonstration, pas de vraies données utilisateur.
 * Elles seront remplacées par Room (stockage local) dans une phase ultérieure,
 * sans changer l'écran : seule la source de l'état changera.
 */
data class HomeUiState(
    val streakDays: Int,
    val recordedMinutes: Int,
    val goalMinutes: Int,
    val coursesToday: Int,
    val pendingAnalyses: Int,
    val revisionsDue: Int,
    val weekMinutes: List<Int>,
    val todayIndex: Int,
    val recentCourses: List<RecentCourse>,
    val revision: RevisionReminder,
) {
    val goalProgress: Float
        get() = if (goalMinutes <= 0) 0f else (recordedMinutes.toFloat() / goalMinutes).coerceIn(0f, 1f)

    val weekTotalMinutes: Int
        get() = weekMinutes.sum()
}

data class RecentCourse(
    val title: String,
    val subject: Subject,
    val chapter: String,
    val durationMinutes: Int,
    val analysed: Boolean,
    val timeLabel: String,
)

data class RevisionReminder(
    val notion: String,
    val subject: Subject,
    val lastSeenLabel: String,
    val masteryPercent: Int,
)

object DemoHomeState {
    val state = HomeUiState(
        streakDays = 4,
        recordedMinutes = 135,
        goalMinutes = 180,
        coursesToday = 3,
        pendingAnalyses = 2,
        revisionsDue = 5,
        // Lundi → dimanche, en minutes. Aujourd'hui = jeudi (index 3).
        weekMinutes = listOf(45, 90, 30, 135, 0, 0, 0),
        todayIndex = 3,
        recentCourses = listOf(
            RecentCourse(
                title = "Fonctions dérivées",
                subject = Subject.MATHEMATICS,
                chapter = "Chapitre 3 · Limites et continuité",
                durationMinutes = 52,
                analysed = true,
                timeLabel = "Aujourd'hui",
            ),
            RecentCourse(
                title = "Les lois de Newton",
                subject = Subject.PHYSICS,
                chapter = "Chapitre 2 · Dynamique du point",
                durationMinutes = 47,
                analysed = false,
                timeLabel = "Aujourd'hui",
            ),
            RecentCourse(
                title = "La Révolution française",
                subject = Subject.HISTORY,
                chapter = "Chapitre 5 · 1789 et ses suites",
                durationMinutes = 36,
                analysed = true,
                timeLabel = "Hier",
            ),
        ),
        revision = RevisionReminder(
            notion = "Théorème de Pythagore",
            subject = Subject.MATHEMATICS,
            lastSeenLabel = "Vu il y a 2 jours",
            masteryPercent = 62,
        ),
    )
}
