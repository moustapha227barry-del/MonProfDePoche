/**
 * Configuration et erreurs du service IA.
 *
 * RÈGLE ABSOLUE : aucune clé d'API dans l'application. Seule l'URL publique du
 * backend sécurisé est connue du client (`EXPO_PUBLIC_API_URL`). C'est ce
 * backend qui détient la clé du fournisseur (Gemini, OpenRouter, OpenAI…).
 *
 * Module pur (aucun import) : testé sous Node dans `tests/ai.test.ts`.
 */

/** Délai maximal d'une analyse : au-delà, on préfère échouer proprement. */
export const AI_TIMEOUT_MS = 150_000;

export const AI_MAX_FILES = 5;

export type AiErrorCode =
  | "missing-backend"
  | "network"
  | "timeout"
  | "rate-limit"
  | "payload-too-large"
  | "unauthorized"
  | "invalid-response"
  | "server";

const MESSAGES: Record<AiErrorCode, string> = {
  "missing-backend":
    "Le service IA n’est pas encore configuré. Renseigne EXPO_PUBLIC_API_URL avec l’adresse du backend sécurisé.",
  network:
    "Impossible de joindre le service IA. Vérifie ta connexion Internet, puis réessaie.",
  timeout:
    "Le service IA met trop de temps à répondre. Réessaie avec un lot plus court (1 ou 2 fichiers).",
  "rate-limit": "Trop de demandes en peu de temps. Patiente une minute avant de relancer l’analyse.",
  "payload-too-large":
    "Le lot est trop volumineux pour être envoyé. Réduis le nombre de fichiers ou la durée des cours.",
  unauthorized:
    "L’accès au service IA a été refusé. Vérifie la configuration du backend (clé API et autorisation).",
  "invalid-response":
    "Le service IA a renvoyé une réponse inexploitable. Aucun cours n’a été enregistré.",
  server: "Le service IA a rencontré une erreur. Réessaie un peu plus tard.",
};

export class AiServiceError extends Error {
  readonly code: AiErrorCode;
  readonly status?: number;

  constructor(code: AiErrorCode, message: string = MESSAGES[code], status?: number) {
    super(message);
    this.name = "AiServiceError";
    this.code = code;
    this.status = status;
  }
}

export function aiMessage(code: AiErrorCode): string {
  return MESSAGES[code];
}

/** `https://exemple.dev/` → `https://exemple.dev`. Renvoie null si invalide. */
export function normalizeBaseUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  const withoutTrailingSlash = value.replace(/\/+$/, "");
  if (!/^https?:\/\/[^\s]+$/i.test(withoutTrailingSlash)) return null;
  return withoutTrailingSlash;
}

/**
 * URL du backend, lue dans la variable publique `EXPO_PUBLIC_API_URL`.
 * Expo remplace cette expression à la compilation : aucune valeur secrète ne
 * peut transiter par elle.
 */
export function backendBaseUrl(): string | null {
  return normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL);
}

export function mapHttpError(status: number): AiServiceError {
  if (status === 401 || status === 403) return new AiServiceError("unauthorized", undefined, status);
  if (status === 413) return new AiServiceError("payload-too-large", undefined, status);
  if (status === 429) return new AiServiceError("rate-limit", undefined, status);
  if (status === 408 || status === 504) return new AiServiceError("timeout", undefined, status);
  if (status >= 400 && status < 500) return new AiServiceError("invalid-response", undefined, status);
  return new AiServiceError("server", undefined, status);
}

/** Convertit une exception réseau en erreur typée, sans la dupliquer. */
export function toAiServiceError(error: unknown): AiServiceError {
  if (error instanceof AiServiceError) return error;
  if (error instanceof Error && error.name === "AbortError") return new AiServiceError("timeout");
  return new AiServiceError("network");
}

/** Message affichable à l'utilisateur, en français. */
export function describeAiError(error: unknown): string {
  return error instanceof AiServiceError ? error.message : aiMessage("network");
}

/** Seules ces erreurs justifient un bouton « Réessayer ». */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof AiServiceError)) return false;
  return error.code === "network" || error.code === "timeout" || error.code === "server";
}
