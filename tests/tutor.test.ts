import assert from "node:assert/strict";
import test from "node:test";

import { AiServiceError } from "../src/lib/ai.ts";
import {
  buildTutorContext,
  buildTutorPayload,
  courseCitationTitles,
  parseTutorResponse,
} from "../src/lib/tutor.ts";
import { makeCourse } from "./fixtures.ts";

test("le contexte du tuteur contient les notions et leurs formules", () => {
  const context = buildTutorContext(makeCourse());
  assert.match(context, /Fonctions dérivées/);
  assert.match(context, /Notion « Dérivée »/);
  assert.match(context, /Formule : y = f'\(a\)/);
  assert.match(context, /Section « Approche »/);
});

test("le contexte est tronqué proprement", () => {
  const context = buildTutorContext(makeCourse(), 80);
  assert.equal(context.length, 81, "80 caractères + l'ellipse");
  assert.ok(context.endsWith("…"));
});

test("la requête du tuteur borne la question et l'historique", () => {
  const history = Array.from({ length: 20 }, (_, index) => ({
    role: (index % 2 === 0 ? "student" : "tutor") as "student" | "tutor",
    content: `message ${index}`,
  }));

  const payload = buildTutorPayload({
    question: "  Explique la dérivée  ",
    course: makeCourse(),
    history,
    level: "college",
  });

  assert.equal(payload.question, "Explique la dérivée");
  assert.equal(payload.level, "college");
  assert.equal(payload.history.length, 12);
  assert.equal(payload.history[0].content, "message 8");
  assert.match(payload.course.context, /Limites/);
});

test("une question vide est refusée avant tout appel réseau", () => {
  assert.throws(
    () => buildTutorPayload({ question: "   ", course: makeCourse() }),
    (error: unknown) => error instanceof AiServiceError,
  );
});

test("les citations inconnues du cours sont supprimées", () => {
  const parsed = parseTutorResponse(
    {
      answer: "La dérivée mesure la variation instantanée.",
      hint: "Pense au taux de variation.",
      citations: ["Dérivée", "Théorème inventé"],
      grounded: true,
    },
    makeCourse(),
  );

  assert.deepEqual(parsed.citations, ["Dérivée"]);
  assert.equal(parsed.grounded, true);
  assert.equal(parsed.hint, "Pense au taux de variation.");
});

test("une réponse sans citation valide est signalée comme non appuyée", () => {
  const parsed = parseTutorResponse(
    { answer: "Réponse hors cours", citations: ["Chapitre inexistant"] },
    makeCourse(),
  );
  assert.deepEqual(parsed.citations, []);
  assert.equal(parsed.grounded, false);

  const notGrounded = parseTutorResponse(
    { answer: "Je ne trouve pas cette notion dans ton cours.", grounded: false, citations: [] },
    makeCourse(),
  );
  assert.equal(notGrounded.grounded, false);
});

test("une réponse vide est refusée", () => {
  assert.throws(() => parseTutorResponse({ answer: "   " }, makeCourse()), AiServiceError);
  assert.throws(() => parseTutorResponse(null, makeCourse()), AiServiceError);
});

test("les titres citables correspondent aux chapitres, sections et notions", () => {
  const titles = courseCitationTitles(makeCourse());
  assert.ok(titles.includes("limites"));
  assert.ok(titles.includes("derivee"));
  assert.ok(titles.includes("approche"));
});
