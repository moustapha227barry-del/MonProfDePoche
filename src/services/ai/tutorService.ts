import type { SubjectId } from "@/domain/subject";

/**
 * Contrat du tuteur IA.
 *
 * Même règle de sécurité que pour l'analyse : la clé du fournisseur d'IA
 * reste sur le backend. Le tuteur reçoit le contexte du cours choisi, répond
 * progressivement (indices avant la réponse finale) et conserve l'historique
 * par cours.
 */

export type TutorMessage = {
  id: string;
  role: "student" | "tutor";
  content: string;
  createdAt: string;
};

export type TutorRequest = {
  question: string;
  subject: SubjectId;
  /** Notions ou extraits de cours fournis comme contexte. */
  context?: string;
  history?: TutorMessage[];
};

export type TutorReply = {
  message: TutorMessage;
  /** Indice proposé avant la réponse complète, quand c'est pertinent. */
  hint?: string;
};

export interface TutorService {
  ask(request: TutorRequest): Promise<TutorReply>;
}
