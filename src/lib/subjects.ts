/**
 * Identifiants de matières, sans dépendance React Native.
 *
 * Ce module est volontairement autonome : il est importé par les helpers
 * purs testés sous Node (`src/lib/*`) et par `src/domain/subject.ts`, qui y
 * ajoute les libellés et les couleurs.
 */
export const SUBJECT_IDS = [
  "mathematics",
  "physics",
  "french",
  "english",
  "history",
  "geography",
  "technicalDrawing",
  "other",
] as const;

export type SubjectId = (typeof SUBJECT_IDS)[number];

export function isSubjectId(value: unknown): value is SubjectId {
  return typeof value === "string" && (SUBJECT_IDS as readonly string[]).includes(value);
}
