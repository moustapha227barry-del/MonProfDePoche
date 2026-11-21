import { analysisBatchRepository } from "@/services/storage/analysisBatchRepository";
import { recordingRepository } from "@/services/storage/recordingRepository";

import { COURSES_FILE, createCourseRepository } from "./courseRepository.ts";
import { expoJsonStore } from "./expoJsonStore.ts";
import { PROFILE_FILE, createProfileRepository } from "./profileRepository.ts";
import { PROGRESS_FILE, createProgressRepository } from "./progressRepository.ts";

/**
 * Repositories réellement utilisés par l'application : tous branchés sur le
 * dossier documents du téléphone, donc disponibles hors ligne.
 */
export const courseRepository = createCourseRepository(expoJsonStore);
export const progressRepository = createProgressRepository(expoJsonStore);
export const profileRepository = createProfileRepository(expoJsonStore);

export { analysisBatchRepository, recordingRepository };

/**
 * Efface toutes les données locales : fichiers audio, index, cours, résultats
 * et profil. Utilisé par « Supprimer mes données » (confirmation obligatoire
 * côté écran).
 */
export async function eraseAllUserData(): Promise<{ recordings: number }> {
  const recordings = await recordingRepository.list();
  for (const recording of recordings) {
    await recordingRepository.remove(recording.id);
  }

  await analysisBatchRepository.clear();
  await expoJsonStore.remove(COURSES_FILE);
  await expoJsonStore.remove(PROGRESS_FILE);
  await expoJsonStore.remove(PROFILE_FILE);
  await expoJsonStore.remove("recordings.json");

  return { recordings: recordings.length };
}
