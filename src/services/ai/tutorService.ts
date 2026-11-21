import type { Course } from "@/domain/course";
import type { TutorLevel, TutorTurn } from "@/lib/tutor";

/**
 * Contrat du tuteur IA.
 *
 * Même règle de sécurité que pour l'analyse : la clé du fournisseur d'IA
 * reste sur le backend. Le tuteur reçoit le contexte du cours choisi et doit
 * répondre en s'appuyant sur ce contexte, en citant les notions utilisées.
 * Une réponse sans appui est signalée (`grounded: false`) et affichée comme
 * telle : elle n'est jamais présentée comme issue du cours.
 *
 * IMPLÉMENTATION : `src/services/ai/httpTutorService.ts`.
 */

export type TutorMessage = {
  id: string;
  role: "student" | "tutor";
  content: string;
  createdAt: string;
};

export type TutorRequest = {
  question: string;
  course: Course;
  history?: TutorTurn[];
  level?: TutorLevel;
};

export type TutorReply = {
  message: TutorMessage;
  /** Indice proposé avant la réponse complète, quand c'est pertinent. */
  hint?: string;
  /** Titres de chapitres / notions réellement présents dans le cours. */
  citations: string[];
  /** Faux quand la réponse ne s'appuie sur aucun passage du cours. */
  grounded: boolean;
};

export interface TutorService {
  ask(request: TutorRequest): Promise<TutorReply>;
}
