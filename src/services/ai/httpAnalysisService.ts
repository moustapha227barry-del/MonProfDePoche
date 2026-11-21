import type { PreparedAnalysisBatch } from "@/lib/basket";

import {
  AI_TIMEOUT_MS,
  AiServiceError,
  backendBaseUrl,
  mapHttpError,
  normalizeBaseUrl,
  toAiServiceError,
} from "../../lib/ai.ts";
import { buildAnalysisRequestPayload, parseAnalysisResponse } from "../../lib/analysis.ts";
import type { AnalysisRequest, AnalysisResult, AnalysisService } from "./analysisService";

/**
 * Client HTTP de l'analyse.
 *
 * Envoie les fichiers audio (multipart) au backend sécurisé, puis valide et
 * normalise la réponse. Aucune clé n'est présente ici : seulement l'URL
 * publique du backend. Toute erreur (réseau, 429, 413, JSON invalide) devient
 * une `AiServiceError` avec un message français actionnable.
 */

export type HttpAnalysisOptions = {
  /** Par défaut : `EXPO_PUBLIC_API_URL`. */
  baseUrl?: string | null;
  fetchImpl?: typeof fetch;
  /** Injectable pour les tests : construction du corps multipart. */
  createBody?: (batch: PreparedAnalysisBatch) => FormData;
  timeoutMs?: number;
  now?: () => Date;
};

export function buildAnalysisFormData(batch: PreparedAnalysisBatch): FormData {
  const form = new FormData();
  form.append("payload", JSON.stringify(buildAnalysisRequestPayload(batch)));
  for (const file of batch.files) {
    // React Native accepte un objet { uri, name, type } comme fichier.
    form.append("audio", {
      uri: file.fileUri,
      name: file.fileName,
      type: file.mimeType,
    } as unknown as Blob);
  }
  return form;
}

export function createHttpAnalysisService(
  options: HttpAnalysisOptions = {},
): AnalysisService {
  const baseUrl =
    options.baseUrl === undefined ? backendBaseUrl() : normalizeBaseUrl(options.baseUrl);
  const doFetch = options.fetchImpl ?? fetch;
  const createBody = options.createBody ?? buildAnalysisFormData;
  const timeoutMs = options.timeoutMs ?? AI_TIMEOUT_MS;
  const now = options.now ?? (() => new Date());

  return {
    async analyse({ batch, language }: AnalysisRequest): Promise<AnalysisResult> {
      if (!baseUrl) throw new AiServiceError("missing-backend");

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await doFetch(`${baseUrl}/analysis`, {
          method: "POST",
          headers: { Accept: "application/json", "X-Client-Language": language },
          body: createBody(batch),
          signal: controller.signal,
        });

        if (!response.ok) throw mapHttpError(response.status);

        let raw: unknown;
        try {
          raw = await response.json();
        } catch {
          throw new AiServiceError("invalid-response");
        }

        return parseAnalysisResponse(raw, { batch, now: now() });
      } catch (error) {
        throw toAiServiceError(error);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
