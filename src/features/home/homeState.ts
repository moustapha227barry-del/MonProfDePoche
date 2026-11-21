import type { SubjectId } from "@/domain/subject";

/**
 * Données affichées par l'écran d'accueil.
 *
 * Toutes les valeurs sont calculées à partir du stockage local réel
 * (enregistrements et cours). Aucune donnée de démonstration n'est fournie
 * ici : quand il n'y a rien, les compteurs restent à zéro.
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
  revision: RevisionReminder | null;
};

export function goalProgress(state: HomeUiState): number {
  if (state.goalMinutes <= 0) return 0;
  return Math.min(1, Math.max(0, state.recordedMinutes / state.goalMinutes));
}

export function weekTotalMinutes(state: HomeUiState): number {
  return state.weekMinutes.reduce((total, minutes) => total + minutes, 0);
}
