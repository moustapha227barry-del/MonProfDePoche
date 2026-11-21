import type { SubjectId } from "./subject";

/**
 * Modèles du domaine, volontairement indépendants de toute bibliothèque.
 *
 * Ils décrivent ce que l'application manipule : un enregistrement, le cours
 * structuré qui en découle, ses exercices, et la progression associée.
 * Les services (stockage local, analyse IA) ne font que remplir ces types.
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

/** Un cours structuré, produit à partir d'un ou plusieurs enregistrements. */
export type Course = {
  id: string;
  title: string;
  subject: SubjectId;
  chapters: Chapter[];
  createdAt: string;
  updatedAt: string;
  status: AnalysisStatus;
};

export type Chapter = {
  id: string;
  title: string;
  summary: string;
  notions: Notion[];
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
};

/** Exercice généré par le tuteur pour vérifier une notion. */
export type Exercise = {
  id: string;
  notionId: string;
  statement: string;
  hints: string[];
  expectedAnswer: string;
};

/** Instantané de progression, affiché par l'onglet « Progrès ». */
export type ProgressSnapshot = {
  totalMinutes: number;
  weekMinutes: number[];
  activeDays: number;
  streakDays: number;
  masteryBySubject: { subject: SubjectId; masteryPercent: number }[];
  revisionsDue: number;
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
