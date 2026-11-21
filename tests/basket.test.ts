import assert from "node:assert/strict";
import test from "node:test";

import { MAX_RECORDINGS_PER_ANALYSIS, type Recording } from "../src/domain/course.ts";
import {
  MAX_BASKET_SIZE,
  addRecordingsToBasket,
  basketCounterLabel,
  basketSelectionSummary,
  prepareAnalysisBatch,
  parsePreparedBatch,
  removeRecordingsFromBasket,
  sameSelection,
  sumDurationMs,
  toggleBasketSelection,
} from "../src/lib/basket.ts";

/**
 * Tests du panier, sans téléphone ni accès disque : seule la logique de
 * sélection, de limite et de préparation du lot est exercée. Les écritures
 * dans `recordings.json` sont faites par le repository Expo et se vérifient
 * sur un appareil (voir `docs/TEST-PANIER.md`).
 */

function makeRecording(id: string, overrides: Partial<Recording> = {}): Recording {
  return {
    id,
    title: `Cours ${id}`,
    subject: "mathematics",
    fileName: `cours-${id}.m4a`,
    fileUri: `file:///documents/Audio/cours-${id}.m4a`,
    durationMs: 60_000,
    createdAt: "2026-11-21T14:00:00.000Z",
    ...overrides,
  };
}

test("le panier accepte 5 fichiers et refuse le sixième", () => {
  assert.equal(MAX_BASKET_SIZE, MAX_RECORDINGS_PER_ANALYSIS);

  let ids: string[] = [];
  for (let index = 0; index < MAX_BASKET_SIZE; index += 1) {
    const result = toggleBasketSelection(ids, `r${index}`);
    assert.equal(result.rejected, false);
    ids = result.ids;
  }
  assert.equal(ids.length, MAX_BASKET_SIZE);

  const sixth = toggleBasketSelection(ids, "r5");
  assert.equal(sixth.rejected, true);
  assert.deepEqual(sixth.ids, ids);
});

test("retirer un fichier libère une place pour un autre", () => {
  const ids = ["a", "b", "c", "d", "e"];

  const afterRemove = toggleBasketSelection(ids, "c");
  assert.deepEqual(afterRemove.ids, ["a", "b", "d", "e"]);

  const afterAdd = toggleBasketSelection(afterRemove.ids, "f");
  assert.equal(afterAdd.rejected, false);
  assert.deepEqual(afterAdd.ids, ["a", "b", "d", "e", "f"]);
});

test("sélectionner deux fois le même fichier ne crée pas de doublon", () => {
  const once = toggleBasketSelection([], "a");
  assert.deepEqual(once.ids, ["a"]);

  const twice = toggleBasketSelection(once.ids, "a");
  assert.deepEqual(twice.ids, []);
});

test("le compteur affiche le nombre de fichiers sur la limite", () => {
  assert.equal(basketCounterLabel(0), "0/5");
  assert.equal(basketCounterLabel(3), "3/5");
  assert.equal(basketCounterLabel(9), "5/5");
  assert.equal(basketSelectionSummary(0), "Aucun fichier sélectionné");
  assert.equal(basketSelectionSummary(1), "1 fichier sélectionné");
  assert.equal(basketSelectionSummary(3), "3 fichiers sélectionnés");
});

test("ajouter au panier ne modifie que la date d'ajout", () => {
  const recordings = [makeRecording("a"), makeRecording("b")];
  const at = "2026-11-21T15:00:00.000Z";

  const updated = addRecordingsToBasket(recordings, ["a"], at);

  assert.equal(updated.length, 2);
  assert.equal(updated[0].addedToBasketAt, at);
  assert.equal(updated[0].fileUri, recordings[0].fileUri);
  assert.equal(updated[0].fileName, recordings[0].fileName);
  assert.equal(updated[1].addedToBasketAt, undefined);
});

test("retirer du panier conserve l'entrée et son fichier audio", () => {
  const recordings = addRecordingsToBasket(
    [makeRecording("a"), makeRecording("b")],
    ["a", "b"],
    "2026-11-21T15:00:00.000Z",
  );

  const updated = removeRecordingsFromBasket(recordings, ["a"]);

  assert.equal(updated.length, 2, "aucun enregistrement ne doit disparaître");

  const removed = updated.find((recording) => recording.id === "a");
  assert.ok(removed);
  assert.equal(removed.addedToBasketAt, undefined);
  assert.equal(removed.fileUri, "file:///documents/Audio/cours-a.m4a");
  assert.equal(removed.fileName, "cours-a.m4a");
  assert.equal(removed.durationMs, 60_000);

  const kept = updated.find((recording) => recording.id === "b");
  assert.equal(kept?.addedToBasketAt, "2026-11-21T15:00:00.000Z");
});

test("préparer l'analyse refuse un panier vide", () => {
  const result = prepareAnalysisBatch([]);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.message, /au moins un/);
});

test("préparer l'analyse refuse plus de 5 fichiers", () => {
  const recordings = Array.from({ length: 6 }, (_, index) => makeRecording(`r${index}`));
  const result = prepareAnalysisBatch(recordings);

  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.message, /5 maximum/);
});

test("préparer l'analyse refuse un fichier introuvable", () => {
  const recordings = [makeRecording("a"), makeRecording("b")];
  const result = prepareAnalysisBatch(recordings, { missingIds: ["b"] });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.deepEqual(result.missingIds, ["b"]);
    assert.match(result.message, /introuvable/);
  }
});

test("un lot prêt décrit les fichiers du futur moteur IA", () => {
  const recordings = [
    makeRecording("a"),
    makeRecording("b", { subject: "physics", durationMs: 30_000 }),
    makeRecording("c", { subject: "french", durationMs: 90_000 }),
  ];
  const now = new Date(2026, 10, 21, 14, 5, 12);

  const result = prepareAnalysisBatch(recordings, { now });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const { batch } = result;
  assert.equal(batch.id, "lot-20261121-140512");
  assert.equal(batch.status, "ready");
  assert.equal(batch.maxFiles, MAX_BASKET_SIZE);
  assert.equal(batch.files.length, 3);
  assert.equal(batch.files[0].recordingId, "a");
  assert.equal(batch.files[1].mimeType, "audio/mp4");
  assert.equal(batch.files[2].fileName, "cours-c.m4a");
  assert.equal(batch.totalDurationMs, 180_000);
  assert.equal(sumDurationMs(recordings), 180_000);
});

test("un lot enregistré se relit, un contenu corrompu est ignoré", () => {
  const result = prepareAnalysisBatch([makeRecording("a")]);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(parsePreparedBatch(JSON.stringify(result.batch)), result.batch);
  assert.equal(parsePreparedBatch("pas du json"), null);
  assert.equal(parsePreparedBatch(JSON.stringify({ id: "x" })), null);
  assert.equal(parsePreparedBatch(JSON.stringify({ ...result.batch, files: [] })), null);
  assert.equal(parsePreparedBatch(JSON.stringify({ ...result.batch, status: "running" })), null);
});

test("l'ordre de la sélection détermine la validité du lot", () => {
  assert.equal(sameSelection(["a", "b"], ["a", "b"]), true);
  assert.equal(sameSelection(["a", "b"], ["b", "a"]), false);
  assert.equal(sameSelection(["a"], ["a", "b"]), false);
  assert.equal(sameSelection([], []), true);
});
