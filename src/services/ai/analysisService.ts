import type { Course } from "@/domain/course";
import type { PreparedAnalysisBatch } from "@/lib/basket";

/**
 * Contrat de l'analyse IA : transformer un lot de 1 à 5 enregistrements en un
 * cours structuré (chapitres, sections, notions, définitions, formules,
 * méthodes, exemples).
 *
 * SÉCURITÉ — RÈGLE ABSOLUE :
 * aucune clé d'API ne doit être écrite dans le code, dans `app.json` ou dans
 * Git. L'application appelle un backend sécurisé (dossier `backend/`) qui
 * détient la clé côté serveur. Le client ne connaît que l'URL publique
 * (`EXPO_PUBLIC_API_URL`).
 *
 * IMPLÉMENTATION : `src/services/ai/httpAnalysisService.ts`, branchée sur ce
 * contrat. Sans backend configuré, elle échoue avec
 * `AiServiceError("missing-backend")` : aucun cours n'est créé.
 */

export type AnalysisRequest = {
  batch: PreparedAnalysisBatch;
  /** Langue du cours, pour que la transcription reste dans la bonne langue. */
  language: "fr";
};

export type AnalysisResult = {
  course: Course;
  /** Transcription complète, conservée localement pour la traçabilité. */
  transcript: string;
  /** Passages incertains signalés par le modèle, jamais inventés. */
  uncertainties: string[];
};

export interface AnalysisService {
  analyse(request: AnalysisRequest): Promise<AnalysisResult>;
}
