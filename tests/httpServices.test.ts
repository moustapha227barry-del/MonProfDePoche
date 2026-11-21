import assert from "node:assert/strict";
import test from "node:test";

import { AiServiceError } from "../src/lib/ai.ts";
import type { PreparedAnalysisBatch } from "../src/lib/basket.ts";
import { createHttpAnalysisService } from "../src/services/ai/httpAnalysisService.ts";
import { createHttpTutorService } from "../src/services/ai/httpTutorService.ts";
import { makeCourse } from "./fixtures.ts";

const BATCH: PreparedAnalysisBatch = {
  id: "lot-20261121-140512",
  createdAt: "2026-11-21T14:05:12.000Z",
  status: "ready",
  maxFiles: 5,
  files: [
    {
      recordingId: "rec-1",
      title: "Cours",
      fileName: "cours-1.m4a",
      fileUri: "file:///documents/Audio/cours-1.m4a",
      subject: "mathematics",
      durationMs: 60_000,
      mimeType: "audio/mp4",
    },
  ],
  totalDurationMs: 60_000,
};

const ANALYSIS_BODY = {
  transcript: "Transcription du cours.",
  uncertainties: [],
  course: {
    title: "Cours analysé",
    subject: "mathematics",
    chapters: [
      {
        title: "Chapitre 1",
        summary: "Résumé",
        sections: [{ title: "Section", content: "Contenu" }],
        notions: [{ title: "Notion", definition: "Définition" }],
      },
    ],
  },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const createBody = (() => ({}) as FormData) as (batch: PreparedAnalysisBatch) => FormData;

test("l'analyse envoie le lot au backend et renvoie un cours", async () => {
  let calledUrl = "";
  let calledInit: RequestInit | undefined;
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calledUrl = url;
    calledInit = init;
    return jsonResponse(ANALYSIS_BODY);
  }) as unknown as typeof fetch;

  const service = createHttpAnalysisService({
    baseUrl: "https://backend.exemple.dev/",
    fetchImpl,
    createBody,
    now: () => new Date("2026-11-21T16:00:00.000Z"),
  });

  const result = await service.analyse({ batch: BATCH, language: "fr" });

  assert.equal(calledUrl, "https://backend.exemple.dev/analysis");
  assert.equal(calledInit?.method, "POST");
  assert.equal(result.course.id, "course-lot-20261121-140512");
  assert.deepEqual(result.course.recordingIds, ["rec-1"]);
  assert.equal(result.transcript, "Transcription du cours.");
});

test("sans backend configuré, aucune requête n'est faite", async () => {
  let calls = 0;
  const service = createHttpAnalysisService({
    baseUrl: null,
    createBody,
    fetchImpl: (async () => {
      calls += 1;
      return jsonResponse({});
    }) as unknown as typeof fetch,
  });

  await assert.rejects(
    () => service.analyse({ batch: BATCH, language: "fr" }),
    (error: unknown) => error instanceof AiServiceError && error.code === "missing-backend",
  );
  assert.equal(calls, 0);
});

test("les erreurs HTTP de l'analyse sont traduites", async () => {
  const cases: [number, string][] = [
    [413, "payload-too-large"],
    [429, "rate-limit"],
    [500, "server"],
    [401, "unauthorized"],
  ];

  for (const [status, code] of cases) {
    const service = createHttpAnalysisService({
      baseUrl: "https://backend.exemple.dev",
      createBody,
      fetchImpl: (async () => jsonResponse({}, status)) as unknown as typeof fetch,
    });
    await assert.rejects(
      () => service.analyse({ batch: BATCH, language: "fr" }),
      (error: unknown) => error instanceof AiServiceError && error.code === code,
      `statut ${status}`,
    );
  }
});

test("une réponse non JSON est refusée sans créer de cours", async () => {
  const service = createHttpAnalysisService({
    baseUrl: "https://backend.exemple.dev",
    createBody,
    fetchImpl: (async () =>
      new Response("<html>oops</html>", { status: 200 })) as unknown as typeof fetch,
  });

  await assert.rejects(
    () => service.analyse({ batch: BATCH, language: "fr" }),
    (error: unknown) => error instanceof AiServiceError && error.code === "invalid-response",
  );
});

test("un réseau injoignable devient une erreur réseau", async () => {
  const service = createHttpAnalysisService({
    baseUrl: "https://backend.exemple.dev",
    createBody,
    fetchImpl: (async () => {
      throw new TypeError("Network request failed");
    }) as unknown as typeof fetch,
  });

  await assert.rejects(
    () => service.analyse({ batch: BATCH, language: "fr" }),
    (error: unknown) => error instanceof AiServiceError && error.code === "network",
  );
});

test("un backend trop lent est interrompu", async () => {
  const service = createHttpAnalysisService({
    baseUrl: "https://backend.exemple.dev",
    createBody,
    timeoutMs: 10,
    fetchImpl: ((_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      })) as unknown as typeof fetch,
  });

  await assert.rejects(
    () => service.analyse({ batch: BATCH, language: "fr" }),
    (error: unknown) => error instanceof AiServiceError && error.code === "timeout",
  );
});

test("le tuteur renvoie une réponse citée et valide le contexte", async () => {
  const course = makeCourse();
  let body = "";
  const service = createHttpTutorService({
    baseUrl: "https://backend.exemple.dev",
    fetchImpl: (async (_url: string, init?: RequestInit) => {
      body = String(init?.body ?? "");
      return jsonResponse({
        answer: "La dérivée mesure la variation instantanée.",
        hint: "Revois le taux de variation.",
        citations: ["Dérivée", "Chapitre inventé"],
        grounded: true,
      });
    }) as unknown as typeof fetch,
    now: () => new Date("2026-11-21T16:00:00.000Z"),
  });

  const reply = await service.ask({ question: "Explique la dérivée", course });

  assert.match(body, /Explique la dérivée/);
  assert.deepEqual(reply.citations, ["Dérivée"]);
  assert.equal(reply.grounded, true);
  assert.equal(reply.hint, "Revois le taux de variation.");
  assert.equal(reply.message.role, "tutor");
  assert.equal(reply.message.createdAt, "2026-11-21T16:00:00.000Z");
});

test("le tuteur sans backend ne fabrique aucune réponse", async () => {
  const service = createHttpTutorService({ baseUrl: "" });
  await assert.rejects(
    () => service.ask({ question: "Aide-moi", course: makeCourse() }),
    (error: unknown) => error instanceof AiServiceError && error.code === "missing-backend",
  );
});
