import type { SubjectId } from "@/lib/subjects";

/**
 * Modèles du domaine, indépendants de toute bibliothèque.
 *
 * Ils décrivent ce que l'application manipule : un enregistrement, le cours
 * structuré qui en découle, ses chapitres, sections et notions, puis les
 * résultats d'exercices qui alimentent la progression.
 */

/** Un enregistrement audio local, avant ou après analyse. */
export type Recording = {
  id: string;
  /** Titre lisible : saisi par l'utilisateur ou « Mathématiques · 21/11/2026 14:05 ». */
  title: string;
  subject: SubjectId;
  /** Nom du fichier seul (sans dossier), utile au partage et au panier. */
  fileName: string;
  /** URI locale du fichier audio (expo-file-system). */
  fileUri: string;
  durationMs: number;
  createdAt: string;
  /** Renseigné quand l'enregistrement a été ajouté au panier d'analyse. */
  addedToBasketAt?: string;
  /** Renseigné quand l'enregistrement a été transformé en cours. */
  courseId?: string;
};

/** Statut d'analyse d'un enregistrement. */
export type AnalysisStatus = "pending" | "running" | "done" | "failed";

/** Une section d'un chapitre : un bloc de texte continu du cours. */
export type Section = {
  id: string;
  title: string;
  content: string;
};

/** Une notion clé : définition, formule ou méthode, avec un niveau d'acquisition. */
export type Notion = {
  id: string;
  title: string;
  definition?: string;
  formula?: string;
  method?: string;
  example?: string;
  masteryPercent: number;
  /** Vrai quand l'IA n'a pas pu établir la notion avec certitude. */
  uncertain?: boolean;
};

export type Chapter = {
  id: string;
  title: string;
  summary: string;
  /** Développement du chapitre, section par section. */
  sections: Section[];
  notions: Notion[];
  /** Renseigné quand l'élève a marqué le chapitre comme étudié. */
  studiedAt?: string;
};

/** Un cours structuré, produit à partir d'un ou plusieurs enregistrements. */
export type Course = {
  id: string;
  title: string;
  subject: SubjectId;
  chapters: Chapter[];
  createdAt: string;
  updatedAt: string;
  status: AnalysisStatus;
  /** Enregistrements d'origine : le lien avec l'audio est conservé. */
  recordingIds: string[];
  /** Passages que l'IA n'a pas pu établir : signalés, jamais inventés. */
  uncertainties: string[];
};

/** Exercice généré par le tuteur pour vérifier une notion. */
export type Exercise = {
  id: string;
  notionId: string;
  statement: string;
  hints: string[];
  expectedAnswer: string;
};

/** Résultat d'un exercice, enregistré localement pour la progression. */
export type ExerciseResult = {
  id: string;
  courseId: string;
  notionId: string;
  correct: boolean;
  answeredAt: string;
};

/** Instantané de progression, affiché par l'onglet « Progrès ». */
export type ProgressSnapshot = {
  totalMinutes: number;
  weekMinutes: number[];
  activeDays: number;
  streakDays: number;
  masteryBySubject: { subject: SubjectId; masteryPercent: number }[];
  revisionsDue: number;
  totalCourses: number;
  totalChapters: number;
  studiedChapters: number;
  totalNotions: number;
  notionsMastered: number;
  notionsToReview: number;
  exerciseResults: number;
  exerciseCorrect: number;
};

/** Révision programmée (répétition espacée). */
export type RevisionCard = {
  id: string;
  notionId: string;
  notionTitle: string;
  subject: SubjectId;
  dueAt: string;
  lastSeenAt?: string;
  masteryPercent: number;
};

/** Limite métier : une analyse porte sur 5 fichiers au maximum. */
export const MAX_RECORDINGS_PER_ANALYSIS = 5;
