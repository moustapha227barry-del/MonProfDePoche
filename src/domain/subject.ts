/**
 * Matières prises en charge par l'application.
 *
 * Le jour où l'application sera traduite, les libellés iront dans un fichier
 * de traductions ; ils sont centralisés ici pour ne pas se disperser.
 */
export type SubjectId =
  | "mathematics"
  | "physics"
  | "french"
  | "english"
  | "history"
  | "geography"
  | "technicalDrawing"
  | "other";

export type Subject = {
  id: SubjectId;
  label: string;
  /** Couleur d'identité, utilisée par les badges et les cartes. */
  accent: string;
};

export const SUBJECTS: readonly Subject[] = [
  { id: "mathematics", label: "Mathématiques", accent: "#A78BFA" },
  { id: "physics", label: "Physique", accent: "#60A5FA" },
  { id: "french", label: "Français", accent: "#FBBF24" },
  { id: "english", label: "Anglais", accent: "#38BDF8" },
  { id: "history", label: "Histoire", accent: "#FB923C" },
  { id: "geography", label: "Géographie", accent: "#2DD4BF" },
  { id: "technicalDrawing", label: "Dessin technique", accent: "#C084FC" },
  { id: "other", label: "Autre matière", accent: "#A6A3BD" },
] as const;

const SUBJECT_BY_ID: Record<SubjectId, Subject> = SUBJECTS.reduce(
  (acc, subject) => ({ ...acc, [subject.id]: subject }),
  {} as Record<SubjectId, Subject>,
);

export function getSubject(id: SubjectId): Subject {
  return SUBJECT_BY_ID[id];
}
