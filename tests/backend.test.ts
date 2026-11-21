import assert from "node:assert/strict";
import test from "node:test";

import {
  ANALYSIS_SYSTEM_PROMPT,
  TUTOR_SYSTEM_PROMPT,
  buildAnalysisPrompt,
  buildTutorPrompt,
} from "../backend/src/prompts.ts";
import {
  MAX_FILES,
  MAX_FILE_BYTES,
  allowRequest,
  extractJson,
  mapUpstreamStatus,
  normalizeAnalysis,
  normalizeTutor,
  validateUploads,
} from "../backend/src/validate.ts";

test("le backend refuse les lots vides, trop gros ou trop nombreux", () => {
  assert.equal(validateUploads([]).ok, false);
  assert.equal(
    validateUploads(Array.from({ length: MAX_FILES + 1 }, () => ({ name: "a.m4a", size: 10 }))).ok,
    false,
  );
  assert.equal(validateUploads([{ name: "a.m4a", size: MAX_FILE_BYTES + 1 }]).ok, false);
  assert.equal(
    validateUploads([
      { name: "a.m4a", size: 20 * 1024 * 1024 },
      { name: "b.m4a", size: 20 * 1024 * 1024 },
      { name: "c.m4a", size: 20 * 1024 * 1024 },
      { name: "d.m4a", size: 20 * 1024 * 1024 },
      { name: "e.m4a", size: 20 * 1024 * 1024 },
    ]).ok,
    false,
  );
  assert.equal(validateUploads([{ name: "a.m4a", size: 1024 }]).ok, true);
});

test("le JSON du modèle est extrait même entouré de texte", () => {
  assert.deepEqual(extractJson('{"a":1}'), { a: 1 });
  assert.deepEqual(extractJson('Voici :\n```json\n{"a":2}\n```'), { a: 2 });
  assert.deepEqual(extractJson('bla {"a":3} bla'), { a: 3 });
  assert.equal(extractJson("pas de json"), null);
  assert.equal(extractJson("{invalide"), null);
  assert.equal(extractJson(""), null);
});

test("la sortie d'analyse est normalisée et nettoyée", () => {
  const normalized = normalizeAnalysis({
    course: {
      title: "  Dérivées  ",
      subject: "mathematics",
      chapters: [
        {
          title: "Limites",
          summary: "Résumé",
          sections: [{ title: "Intro", content: "Contenu" }],
          notions: [{ title: "Dérivée", formula: "f'(a)", masteryPercent: 99 }],
        },
        { title: "", sections: [], notions: [] },
      ],
    },
    uncertainties: ["Passage inaudible", 42],
    transcript: "Transcription",
  });

  assert.ok(normalized);
  assert.equal(normalized.course.title, "Dérivées");
  assert.equal(normalized.course.chapters.length, 1);
  assert.equal("masteryPercent" in normalized.course.chapters[0].notions[0], false);
  assert.deepEqual(normalized.uncertainties, ["Passage inaudible"]);
  assert.equal(normalized.transcript, "Transcription");
});

test("une sortie d'analyse vide est refusée", () => {
  assert.equal(normalizeAnalysis(null), null);
  assert.equal(normalizeAnalysis({}), null);
  assert.equal(normalizeAnalysis({ course: { title: "", chapters: [] } }), null);
  assert.equal(
    normalizeAnalysis({ course: { title: "Cours", chapters: [{ title: "Vide" }] } }),
    null,
  );
});

test("la sortie du tuteur exige une réponse et des citations connues", () => {
  const normalized = normalizeTutor({
    answer: "Voici l'explication.",
    hint: "Pense au taux de variation.",
    citations: ["Dérivée", 12],
    grounded: true,
  });
  assert.ok(normalized);
  assert.deepEqual(normalized.citations, ["Dérivée"]);
  assert.equal(normalized.grounded, true);

  assert.equal(normalizeTutor({ answer: "   " }), null);
  assert.equal(normalizeTutor({ answer: "x", citations: [], grounded: false })?.grounded, false);
});

test("les statuts du fournisseur ne fuient pas vers le client", () => {
  assert.deepEqual(mapUpstreamStatus(429), { status: 429, code: "provider-rate-limit" });
  assert.deepEqual(mapUpstreamStatus(401), { status: 502, code: "provider-auth" });
  assert.deepEqual(mapUpstreamStatus(500), { status: 502, code: "provider-error" });
  assert.deepEqual(mapUpstreamStatus(422), { status: 400, code: "provider-rejected" });
});

test("le limiteur de débit autorise 8 requêtes par minute puis bloque", () => {
  const now = 1_000_000;
  let timestamps: number[] = [];
  for (let index = 0; index < 8; index += 1) {
    const result = allowRequest(timestamps, now + index);
    assert.equal(result.allowed, true);
    timestamps = result.timestamps;
  }
  assert.equal(allowRequest(timestamps, now + 10).allowed, false);
  assert.equal(allowRequest(timestamps, now + 61_000).allowed, true);
});

test("les prompts interdisent d'inventer et imposent le JSON", () => {
  assert.match(ANALYSIS_SYSTEM_PROMPT, /N'invente aucune information/);
  assert.match(ANALYSIS_SYSTEM_PROMPT, /uncertainties/);
  assert.match(TUTOR_SYSTEM_PROMPT, /Ne prétends jamais citer/);
  assert.match(buildAnalysisPrompt([{ fileName: "a.m4a", subject: "maths", durationMs: 60_000 }]), /a\.m4a/);
  assert.match(buildTutorPrompt({ question: "Pourquoi ?", level: "lycee", courseContext: "Cours X" }), /Pourquoi/);
});
