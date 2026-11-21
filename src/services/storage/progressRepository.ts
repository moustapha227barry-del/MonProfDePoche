import type { ExerciseResult, RevisionCard } from "@/domain/course";

import { readJsonObject, type JsonStore } from "./jsonStore.ts";

/**
 * Résultats d'exercices et révisions programmées (`progress.json`).
 *
 * Seuls de vrais résultats sont enregistrés : tant qu'aucun exercice n'a été
 * fait, le fichier reste vide et l'écran Progrès l'indique clairement.
 */

export const PROGRESS_FILE = "progress.json";
const MAX_RESULTS = 2000;

export type ProgressState = {
  exerciseResults: ExerciseResult[];
  revisions: RevisionCard[];
};

function parseResult(value: unknown): ExerciseResult | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.courseId !== "string" ||
    typeof candidate.notionId !== "string" ||
    typeof candidate.answeredAt !== "string" ||
    typeof candidate.correct !== "boolean"
  ) {
    return null;
  }
  return {
    id: candidate.id,
    courseId: candidate.courseId,
    notionId: candidate.notionId,
    correct: candidate.correct,
    answeredAt: candidate.answeredAt,
  };
}

function parseRevision(value: unknown): RevisionCard | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.notionId !== "string" ||
    typeof candidate.notionTitle !== "string" ||
    typeof candidate.subject !== "string" ||
    typeof candidate.dueAt !== "string" ||
    typeof candidate.masteryPercent !== "number"
  ) {
    return null;
  }
  return candidate as RevisionCard;
}

function parseState(value: unknown): ProgressState {
  if (typeof value !== "object" || value === null) {
    return { exerciseResults: [], revisions: [] };
  }
  const candidate = value as Record<string, unknown>;
  return {
    exerciseResults: Array.isArray(candidate.exerciseResults)
      ? candidate.exerciseResults
          .map(parseResult)
          .filter((item): item is ExerciseResult => item !== null)
      : [],
    revisions: Array.isArray(candidate.revisions)
      ? candidate.revisions
          .map(parseRevision)
          .filter((item): item is RevisionCard => item !== null)
      : [],
  };
}

export function createProgressRepository(store: JsonStore) {
  async function load(): Promise<ProgressState> {
    return readJsonObject(
      await store.read(PROGRESS_FILE),
      parseState,
      { exerciseResults: [], revisions: [] },
    );
  }

  return {
    load,

    async listResults(courseId?: string): Promise<ExerciseResult[]> {
      const state = await load();
      return courseId
        ? state.exerciseResults.filter((result) => result.courseId === courseId)
        : state.exerciseResults;
    },

    /** Enregistre un résultat (remplace un résultat de même identifiant). */
    async recordExercise(result: ExerciseResult): Promise<void> {
      const state = await load();
      const others = state.exerciseResults.filter((item) => item.id !== result.id);
      const exerciseResults = [result, ...others].slice(0, MAX_RESULTS);
      await store.write(PROGRESS_FILE, JSON.stringify({ ...state, exerciseResults }, null, 2));
    },

    async clear(): Promise<void> {
      await store.remove(PROGRESS_FILE);
    },
  };
}

export type ProgressRepository = ReturnType<typeof createProgressRepository>;
