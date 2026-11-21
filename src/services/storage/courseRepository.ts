import type { Course, Recording, RevisionCard } from "@/domain/course";

/**
 * Contrat du stockage local.
 *
 * IMPLÉMENTATION PRÉVUE : `expo-sqlite` (inclus dans Expo Go). Les fichiers
 * audio restent dans le système de fichiers de l'application
 * (`expo-file-system`) ; la base ne stocke que les métadonnées et les textes.
 * Aucune donnée utilisateur ne part sur Internet sans action explicite.
 */
export interface CourseRepository {
  saveRecording(recording: Recording): Promise<void>;
  listRecordings(): Promise<Recording[]>;
  removeRecording(id: string): Promise<void>;

  saveCourse(course: Course): Promise<void>;
  listCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | null>;
  removeCourse(id: string): Promise<void>;

  listRevisionsDue(): Promise<RevisionCard[]>;
}
