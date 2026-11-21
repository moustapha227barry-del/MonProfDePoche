import {
  AI_TIMEOUT_MS,
  AiServiceError,
  backendBaseUrl,
  mapHttpError,
  normalizeBaseUrl,
  toAiServiceError,
} from "../../lib/ai.ts";
import { buildTutorPayload, parseTutorResponse } from "../../lib/tutor.ts";
import type { TutorReply, TutorRequest, TutorService } from "./tutorService";

/**
 * Client HTTP du tuteur. Le cours complet (contexte) est envoyé au backend,
 * qui répond avec citations. Les citations inconnues du cours sont retirées
 * côté client : le tuteur ne peut pas prétendre citer un contenu qui n'existe
 * pas dans le cours de l'élève.
 */

export type HttpTutorOptions = {
  baseUrl?: string | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  now?: () => Date;
};

export function createHttpTutorService(options: HttpTutorOptions = {}): TutorService {
  const baseUrl =
    options.baseUrl === undefined ? backendBaseUrl() : normalizeBaseUrl(options.baseUrl);
  const doFetch = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? AI_TIMEOUT_MS;
  const now = options.now ?? (() => new Date());

  return {
    async ask({ question, course, history, level }: TutorRequest): Promise<TutorReply> {
      if (!baseUrl) throw new AiServiceError("missing-backend");

      const payload = buildTutorPayload({ question, course, history, level });
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await doFetch(`${baseUrl}/tutor`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) throw mapHttpError(response.status);

        let raw: unknown;
        try {
          raw = await response.json();
        } catch {
          throw new AiServiceError("invalid-response");
        }

        const parsed = parseTutorResponse(raw, course);
        return {
          message: {
            id: `tutor-${now().getTime()}`,
            role: "tutor",
            content: parsed.answer,
            createdAt: now().toISOString(),
          },
          hint: parsed.hint,
          citations: parsed.citations,
          grounded: parsed.grounded,
        };
      } catch (error) {
        throw toAiServiceError(error);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
