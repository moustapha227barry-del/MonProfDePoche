import type { Course, Recording } from "@/domain/course";

/**
 * Contrat de l'analyse IA : transformer jusqu'à 5 enregistrements en un cours
 * structuré (chapitres, notions, définitions, formules, méthodes).
 *
 * SÉCURITÉ — RÈGLE ABSOLUE :
 * aucune clé d'API ne doit être écrite dans le code, dans `app.json` ou dans
 * Git. L'application appellera un backend sécurisé (Supabase Edge Function ou
 * équivalent) qui détient la clé côté serveur. Le client ne connaît que
 * l'URL publique du backend (`EXPO_PUBLIC_API_URL`).
 *
 * Tant que ce backend n'existe pas, l'implémentation doit échouer proprement
 * avec un message explicite : aucune donnée n'est envoyée nulle part.
 */

export type AnalysisRequest = {
  recordings: Recording[];
  /** Langue du cours, pour que le résumé reste dans la bonne langue. */
  language: "fr";
};

export type AnalysisResult = {
  course: Course;
  /** Notions dont la maîtrise doit être retravaillée. */
  weakNotions: string[];
};

export interface AnalysisService {
  analyse(request: AnalysisRequest): Promise<AnalysisResult>;
}

/** Erreur levée quand le backend n'est pas encore configuré. */
export class AnalysisBackendMissingError extends Error {
  constructor() {
    super(
      "Analyse indisponible : le backend sécurisé n'est pas encore configuré (voir docs/MIGRATION-EXPO.md).",
    );
    this.name = "AnalysisBackendMissingError";
  }
}
