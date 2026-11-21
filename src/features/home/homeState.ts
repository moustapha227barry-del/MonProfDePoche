import type { SubjectId } from "@/domain/subject";

/**
 * Données affichées par l'écran d'accueil.
 *
 * ATTENTION : à ce stade, les valeurs viennent de DEMO_HOME_STATE.
 * Ce sont des données de démonstration, pas de vraies données utilisateur.
 * Elles seront remplacées par le stockage local (expo-sqlite) sans changer
 * l'écran : seule la source de l'état changera.
 */
export type RecentCourse = {
  id: string;
  title: string;
  subject: SubjectId;
  chapter: string;
  durationMinutes: number;
  analysed: boolean;
  timeLabel: string;
};

export type RevisionReminder = {
  notion: string;
  subject: SubjectId;
  lastSeenLabel: string;
  masteryPercent: number;
};

export type HomeUiState = {
  streakDays: number;
  recordedMinutes: number;
  goalMinutes: number;
  coursesToday: number;
  pendingAnalyses: number;
  revisionsDue: number;
  /** Lundi → dimanche, en minutes. */
  weekMinutes: number[];
  todayIndex: number;
  recentCourses: RecentCourse[];
  revision: RevisionReminder;
};

export function goalProgress(state: HomeUiState): number {
  if (state.goalMinutes <= 0) return 0;
  return Math.min(1, Math.max(0, state.recordedMinutes / state.goalMinutes));
}

export function weekTotalMinutes(state: HomeUiState): number {
  return state.weekMinutes.reduce((total, minutes) => total + minutes, 0);
}

export const DEMO_HOME_STATE: HomeUiState = {
  streakDays: 4,
  recordedMinutes: 135,
  goalMinutes: 180,
  coursesToday: 3,
  pendingAnalyses: 2,
  revisionsDue: 5,
  // Lundi → dimanche, en minutes. Aujourd'hui = jeudi (index 3).
  weekMinutes: [45, 90, 30, 135, 0, 0, 0],
  todayIndex: 3,
  recentCourses: [
    {
      id: "course-derivees",
      title: "Fonctions dérivées",
      subject: "mathematics",
      chapter: "Chapitre 3 · Limites et continuité",
      durationMinutes: 52,
      analysed: true,
      timeLabel: "Aujourd'hui",
    },
    {
      id: "course-newton",
      title: "Les lois de Newton",
      subject: "physics",
      chapter: "Chapitre 2 · Dynamique du point",
      durationMinutes: 47,
      analysed: false,
      timeLabel: "Aujourd'hui",
    },
    {
      id: "course-revolution",
      title: "La Révolution française",
      subject: "history",
      chapter: "Chapitre 5 · 1789 et ses suites",
      durationMinutes: 36,
      analysed: true,
      timeLabel: "Hier",
    },
  ],
  revision: {
    notion: "Théorème de Pythagore",
    subject: "mathematics",
    lastSeenLabel: "Vu il y a 2 jours",
    masteryPercent: 62,
  },
};
