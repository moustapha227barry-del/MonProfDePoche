import assert from "node:assert/strict";
import test from "node:test";

import { AiServiceError } from "../src/lib/ai.ts";
import { buildAnalysisRequestPayload, parseAnalysisResponse } from "../src/lib/analysis.ts";
import type { PreparedAnalysisBatch } from "../src/lib/basket.ts";

const BATCH: PreparedAnalysisBatch = {
  id: "lot-20261121-140512",
  createdAt: "2026-11-21T14:05:12.000Z",
  status: "ready",
  maxFiles: 5,
  files: [
    {
      recordingId: "rec-1",
      title: "Cours de maths",
      fileName: "cours-mathematics-20261121-140512.m4a",
      fileUri: "file:///documents/Audio/cours-mathematics-20261121-140512.m4a",
      subject: "mathematics",
      durationMs: 60_000,
      mimeType: "audio/mp4",
    },
  ],
  totalDurationMs: 60_000,
};

const RESPONSE = {
  transcript: "Aujourd'hui nous avons étudié les dérivées…",
  uncertainties: ["Le passage sur les limites est peu audible."],
  course: {
    title: "Dérivées et tangentes",
    subject: "mathematics",
    chapters: [
      {
        title: "Limites",
        summary: "Approche intuitive de la limite.",
        sections: [{ title: "Introduction", content: "On considère une fonction définie près de a." }],
        notions: [
          {
            title: "Dérivée",
            definition: "Taux de variation instantané.",
            formula: "f'(a) = lim (f(a+h)-f(a))/h",
            example: "Pour f(x)=x², f'(3)=6.",
            masteryPercent: 99,
          },
        ],
      },
    ],
  },
};

function expectInvalid(fn: () => unknown): void {
  assert.throws(fn, (error: unknown) => {
    return error instanceof AiServiceError && error.code === "invalid-response";
  });
}

test("la requête ne transmet que les métadonnées utiles", () => {
  const payload = buildAnalysisRequestPayload(BATCH);
  assert.equal(payload.language, "fr");
  assert.equal(payload.batch.id, BATCH.id);
  assert.deepEqual(payload.batch.files[0], {
    recordingId: "rec-1",
    fileName: "cours-mathematics-20261121-140512.m4a",
    mimeType: "audio/mp4",
    subject: "mathematics",
    durationMs: 60_000,
  });
  assert.equal("fileUri" in payload.batch.files[0], false);
});

test("une réponse valide devient un cours complet et traçable", () => {
  const result = parseAnalysisResponse(RESPONSE, {
    batch: BATCH,
    now: new Date("2026-11-21T16:00:00.000Z"),
  });

  assert.equal(result.course.id, "course-lot-20261121-140512");
  assert.equal(result.course.title, "Dérivées et tangentes");
  assert.equal(result.course.status, "done");
  assert.deepEqual(result.course.recordingIds, ["rec-1"]);
  assert.deepEqual(result.course.uncertainties, RESPONSE.uncertainties);
  assert.equal(result.transcript, RESPONSE.transcript);
  assert.equal(result.course.chapters.length, 1);
  assert.equal(result.course.chapters[0].id, "chapter-1");
  assert.equal(result.course.chapters[0].sections[0].id, "chapter-1-section-1");
  assert.equal(result.course.chapters[0].notions[0].id, "chapter-1-notion-1");
  // La maîtrise ne vient jamais du modèle.
  assert.equal(result.course.chapters[0].notions[0].masteryPercent, 0);
  assert.equal(result.course.createdAt, "2026-11-21T16:00:00.000Z");
});

test("une matière inconnue retombe sur celle du lot", () => {
  const result = parseAnalysisResponse(
    { ...RESPONSE, course: { ...RESPONSE.course, subject: "svt" } },
    { batch: BATCH },
  );
  assert.equal(result.course.subject, "mathematics");
});

test("les réponses inexploitables sont refusées", () => {
  expectInvalid(() => parseAnalysisResponse(null, { batch: BATCH }));
  expectInvalid(() => parseAnalysisResponse("texte", { batch: BATCH }));
  expectInvalid(() => parseAnalysisResponse({}, { batch: BATCH }));
  expectInvalid(() =>
    parseAnalysisResponse({ course: { title: "", chapters: [] } }, { batch: BATCH }),
  );
  expectInvalid(() =>
    parseAnalysisResponse({ course: { title: "Cours", chapters: [] } }, { batch: BATCH }),
  );
  expectInvalid(() =>
    parseAnalysisResponse(
      { course: { title: "Cours", chapters: [{ title: "Vide", sections: [], notions: [] }] } },
      { batch: BATCH },
    ),
  );
});

test("les listes trop longues sont bornées et les champs inutiles ignorés", () => {
  const chapters = Array.from({ length: 50 }, (_, index) => ({
    title: `Chapitre ${index}`,
    summary: "…",
    sections: [{ title: "S", content: "C" }],
    notions: [],
  }));

  const result = parseAnalysisResponse(
    { transcript: "x".repeat(300_000), course: { title: "Long", chapters } },
    { batch: BATCH },
  );

  assert.equal(result.course.chapters.length, 40);
  assert.equal(result.transcript.length, 200_000);
});
