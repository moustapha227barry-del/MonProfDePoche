import assert from "node:assert/strict";
import test from "node:test";

import type { Recording } from "../src/domain/course.ts";
import {
  RECORDING_EXTENSION,
  buildRecordingFileName,
  emptyLevels,
  formatRecordingDate,
  formatRecordingDuration,
  formatRecordingTitle,
  normalizeMetering,
  parseRecordingIndex,
  pushLevel,
} from "../src/lib/recording.ts";

/**
 * Tests des helpers purs de l'enregistrement (aucun accès micro ni fichier).
 * La capture réelle se vérifie sur un téléphone via Expo Go : voir
 * docs/MIGRATION-EXPO.md, section « Enregistrement audio ».
 */

test("le nom de fichier est déterministe, sans accent ni espace", () => {
  const date = new Date(2026, 10, 21, 14, 5, 12);
  assert.equal(buildRecordingFileName("mathematics", date), "cours-mathematics-20261121-140512");
  assert.equal(
    buildRecordingFileName("technicalDrawing", date),
    "cours-technical-drawing-20261121-140512",
  );
  assert.equal(RECORDING_EXTENSION, ".m4a");
});

test("le titre par défaut reprend la matière et l'heure du cours", () => {
  const date = new Date(2026, 10, 21, 9, 3, 0);
  assert.equal(formatRecordingTitle("Physique", date), "Physique · 21/11/2026 09:03");
});

test("le niveau micro est normalisé entre 0 et 1", () => {
  assert.equal(normalizeMetering(undefined), 0);
  assert.equal(normalizeMetering(null), 0);
  assert.equal(normalizeMetering(Number.NaN), 0);
  assert.equal(normalizeMetering(-200), 0);
  assert.equal(normalizeMetering(-60), 0);
  assert.equal(normalizeMetering(-30), 0.5);
  assert.equal(normalizeMetering(0), 1);
  assert.equal(normalizeMetering(12), 1);
});

test("l'onde garde une largeur fixe et borne ses valeurs", () => {
  let levels = emptyLevels(4);
  assert.deepEqual(levels, [0, 0, 0, 0]);

  levels = pushLevel(levels, 2, 4);
  assert.deepEqual(levels, [0, 0, 0, 1]);

  levels = pushLevel(levels, 0.5, 4);
  assert.deepEqual(levels, [0, 0, 1, 0.5]);
});

test("les durées et les dates s'affichent en français", () => {
  assert.equal(formatRecordingDuration(45_000), "45 s");
  assert.equal(formatRecordingDuration(754_000), "12 min 34 s");
  assert.equal(formatRecordingDuration(3_720_000), "1 h 02 min");

  const local = new Date(2026, 10, 21, 14, 5, 0).toISOString();
  assert.equal(formatRecordingDate(local), "21/11/2026 · 14:05");
  assert.equal(formatRecordingDate("pas une date"), "Date inconnue");
});

test("l'index local ignore les entrées invalides", () => {
  const valid: Recording = {
    id: "abc",
    title: "Mathématiques · 21/11/2026 14:05",
    subject: "mathematics",
    fileName: "cours-mathematics-20261121-140512.m4a",
    fileUri: "file:///documents/Audio/cours-mathematics-20261121-140512.m4a",
    durationMs: 61_000,
    createdAt: "2026-11-21T14:06:01.000Z",
  };

  assert.deepEqual(parseRecordingIndex(JSON.stringify([valid])), [valid]);
  assert.deepEqual(parseRecordingIndex(JSON.stringify([valid, { id: "incomplet" }])), [valid]);
  assert.deepEqual(parseRecordingIndex("pas du json"), []);
  assert.deepEqual(parseRecordingIndex(JSON.stringify({})), []);
  assert.deepEqual(parseRecordingIndex(JSON.stringify([{ ...valid, durationMs: "61" }])), []);
});
