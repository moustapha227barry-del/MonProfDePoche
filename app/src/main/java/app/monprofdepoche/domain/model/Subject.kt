package app.monprofdepoche.domain.model

import androidx.annotation.StringRes
import app.monprofdepoche.R

/**
 * Matières prises en charge par l'application.
 * Les libellés vivent dans les ressources pour rester traduisibles.
 */
enum class Subject(@StringRes val labelRes: Int) {
    MATHEMATICS(R.string.subject_maths),
    PHYSICS(R.string.subject_physics),
    FRENCH(R.string.subject_french),
    ENGLISH(R.string.subject_english),
    HISTORY(R.string.subject_history),
    GEOGRAPHY(R.string.subject_geography),
    TECHNICAL_DRAWING(R.string.subject_drawing),
    OTHER(R.string.subject_other),
}
