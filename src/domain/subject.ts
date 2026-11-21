import { SUBJECT_IDS, type SubjectId } from "@/lib/subjects";

/**
 * Matières prises en charge par l'application.
 *
 * Les identifiants viennent de `src/lib/subjects.ts` (module pur, utilisable
 * hors React Native). Ce fichier ajoute les libellés et les couleurs.
 */
export type { SubjectId };

export type Subject = {
  id: SubjectId;
  label: string;
  /** Couleur d'identité, utilisée par les badges et les cartes. */
  accent: string;
};

const SUBJECT_DETAILS: Record<SubjectId, { label: string; accent: string }> = {
  mathematics: { label: "Mathématiques", accent: "#A78BFA" },
  physics: { label: "Physique", accent: "#60A5FA" },
  french: { label: "Français", accent: "#FBBF24" },
  english: { label: "Anglais", accent: "#38BDF8" },
  history: { label: "Histoire", accent: "#FB923C" },
  geography: { label: "Géographie", accent: "#2DD4BF" },
  technicalDrawing: { label: "Dessin technique", accent: "#C084FC" },
  other: { label: "Autre matière", accent: "#A6A3BD" },
};

export const SUBJECTS: readonly Subject[] = SUBJECT_IDS.map((id) => ({
  id,
  ...SUBJECT_DETAILS[id],
}));

const SUBJECT_BY_ID: Record<SubjectId, Subject> = SUBJECTS.reduce(
  (acc, subject) => ({ ...acc, [subject.id]: subject }),
  {} as Record<SubjectId, Subject>,
);

export function getSubject(id: SubjectId): Subject {
  return SUBJECT_BY_ID[id] ?? SUBJECT_BY_ID.other;
}
