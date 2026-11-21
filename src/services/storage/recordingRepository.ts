import { File, Paths } from "expo-file-system";

import type { Recording } from "@/domain/course";
import {
  addRecordingsToBasket,
  removeRecordingsFromBasket,
} from "@/lib/basket";
import { parseRecordingIndex } from "@/lib/recording";

/**
 * Stockage local des enregistrements audio.
 *
 * Les fichiers `.m4a` sont écrits par `expo-audio` dans le dossier **documents**
 * de l'application (jamais dans le cache, que le système peut vider). Cet index
 * `recordings.json`, dans le même dossier, conserve les métadonnées : titre,
 * matière, date, durée et chemin du fichier.
 *
 * Aucune donnée ne quitte le téléphone. Le panier d'analyse s'appuie sur le
 * champ `addedToBasketAt` de cet index : ajouter ou retirer un fichier du
 * panier ne modifie que cette date, jamais le fichier `.m4a` lui-même.
 */

const INDEX_FILE_NAME = "recordings.json";

function indexFile(): File {
  return new File(Paths.document, INDEX_FILE_NAME);
}

async function readIndex(): Promise<Recording[]> {
  const file = indexFile();
  if (!file.exists) return [];
  try {
    return parseRecordingIndex(await file.text());
  } catch (error) {
    console.warn("[enregistrements] index illisible", error);
    return [];
  }
}

async function writeIndex(recordings: Recording[]): Promise<void> {
  const file = indexFile();
  if (!file.exists) {
    file.create();
  }
  await file.write(JSON.stringify(recordings, null, 2));
}

function sortByNewest(recordings: Recording[]): Recording[] {
  return [...recordings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function deleteAudioFile(fileUri: string): Promise<void> {
  try {
    const file = new File(fileUri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn("[enregistrements] fichier audio non supprimé", error);
  }
}

/** Vrai si le fichier audio est encore présent sur le téléphone. */
function audioFileExists(fileUri: string): boolean {
  try {
    return new File(fileUri).exists;
  } catch {
    return false;
  }
}

export const recordingRepository = {
  /** Tous les enregistrements, du plus récent au plus ancien. */
  async list(): Promise<Recording[]> {
    return sortByNewest(await readIndex());
  },

  /** Enregistre (ou met à jour) un enregistrement et son fichier déjà écrit. */
  async save(recording: Recording): Promise<void> {
    const others = (await readIndex()).filter((item) => item.id !== recording.id);
    await writeIndex(sortByNewest([recording, ...others]));
  },

  /** Renomme un enregistrement sans toucher au fichier audio. */
  async rename(id: string, title: string): Promise<Recording | null> {
    const clean = title.trim().slice(0, 120);
    if (!clean) return null;
    const recordings = await readIndex();
    const target = recordings.find((item) => item.id === id);
    if (!target) return null;
    const updated: Recording = { ...target, title: clean };
    await writeIndex(recordings.map((item) => (item.id === id ? updated : item)));
    return updated;
  },

  /**
   * Relie des enregistrements au cours issu de leur analyse et les sort du
   * panier. Le fichier audio n'est pas modifié.
   */
  async attachCourse(ids: readonly string[], courseId: string): Promise<void> {
    if (ids.length === 0) return;
    const recordings = await readIndex();
    await writeIndex(
      recordings.map((item) => {
        if (!ids.includes(item.id)) return item;
        const copy: Recording = { ...item, courseId };
        delete copy.addedToBasketAt;
        return copy;
      }),
    );
  },

  /** Détache les enregistrements d'un cours supprimé, sans effacer l'audio. */
  async detachCourse(courseId: string): Promise<void> {
    const recordings = await readIndex();
    await writeIndex(
      recordings.map((item) => {
        if (item.courseId !== courseId) return item;
        const copy: Recording = { ...item };
        delete copy.courseId;
        return copy;
      }),
    );
  },

  /** Supprime les métadonnées et le fichier audio associé. */
  async remove(id: string): Promise<void> {
    const recordings = await readIndex();
    const target = recordings.find((item) => item.id === id);
    if (target) await deleteAudioFile(target.fileUri);
    await writeIndex(recordings.filter((item) => item.id !== id));
  },

  /**
   * Contenu du panier, dans l'ordre d'ajout (le plus ancien d'abord).
   * Un enregistrement n'y figure que si `addedToBasketAt` est renseigné.
   */
  async listBasket(): Promise<Recording[]> {
    const recordings = await readIndex();
    return recordings
      .filter((item) => Boolean(item.addedToBasketAt))
      .sort((a, b) => (a.addedToBasketAt ?? "").localeCompare(b.addedToBasketAt ?? ""));
  },

  /** Ajoute des enregistrements au panier (métadonnées seulement). */
  async addToBasket(ids: readonly string[], at: Date = new Date()): Promise<void> {
    if (ids.length === 0) return;
    const recordings = await readIndex();
    await writeIndex(addRecordingsToBasket(recordings, ids, at.toISOString()));
  },

  /**
   * Retire des enregistrements du panier **sans supprimer leur fichier audio** :
   * seule la date d'ajout est effacée de l'index.
   */
  async removeFromBasket(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;
    const recordings = await readIndex();
    await writeIndex(removeRecordingsFromBasket(recordings, ids));
  },

  /** Identifiants dont le fichier `.m4a` a disparu du téléphone. */
  missingIds(recordings: readonly Recording[]): string[] {
    return recordings
      .filter((item) => !audioFileExists(item.fileUri))
      .map((item) => item.id);
  },

  /**
   * Préparation du panier : enregistrements pas encore sélectionnés pour une
   * analyse, du plus récent au plus ancien.
   */
  async listPendingAnalysis(): Promise<Recording[]> {
    const recordings = await readIndex();
    return sortByNewest(recordings.filter((item) => !item.addedToBasketAt && !item.courseId));
  },

  /** Préparation du panier : marque une sélection validée (5 fichiers maximum). */
  async markAddedToBasket(ids: readonly string[], at: Date = new Date()): Promise<void> {
    await recordingRepository.addToBasket(ids, at);
  },
};

export type RecordingRepository = typeof recordingRepository;
