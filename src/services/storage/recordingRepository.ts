import { File, Paths } from "expo-file-system";

import type { Recording } from "@/domain/course";
import { parseRecordingIndex } from "@/lib/recording";

/**
 * Stockage local des enregistrements audio.
 *
 * Les fichiers `.m4a` sont écrits par `expo-audio` dans le dossier **documents**
 * de l'application (jamais dans le cache, que le système peut vider). Cet index
 * `recordings.json`, dans le même dossier, conserve les métadonnées : titre,
 * matière, date, durée et chemin du fichier.
 *
 * Aucune donnée ne quitte le téléphone. Quand le panier sera développé, il
 * lira `listPendingAnalysis()` et marquera ses sélections avec
 * `markAddedToBasket()` ; le fichier reste la source de vérité pour l'analyse.
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

  /** Supprime les métadonnées et le fichier audio associé. */
  async remove(id: string): Promise<void> {
    const recordings = await readIndex();
    const target = recordings.find((item) => item.id === id);
    if (target) await deleteAudioFile(target.fileUri);
    await writeIndex(recordings.filter((item) => item.id !== id));
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
    if (ids.length === 0) return;
    const timestamp = at.toISOString();
    const recordings = await readIndex();
    await writeIndex(
      recordings.map((item) =>
        ids.includes(item.id) ? { ...item, addedToBasketAt: timestamp } : item,
      ),
    );
  },
};

export type RecordingRepository = typeof recordingRepository;
