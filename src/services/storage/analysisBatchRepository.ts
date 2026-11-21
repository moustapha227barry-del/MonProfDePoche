import { File, Paths } from "expo-file-system";

import { parsePreparedBatch, type PreparedAnalysisBatch } from "@/lib/basket";

/**
 * Stockage du lot préparé pour l'analyse.
 *
 * Le lot ne contient que des **références** aux fichiers audio locaux
 * (identifiant, nom, URI, matière, durée). Aucun son n'est copié ni envoyé :
 * le futur moteur IA lira les `.m4a` depuis le dossier documents du téléphone.
 *
 * Le fichier `prepared-analysis.json` est remplacé à chaque nouvelle
 * préparation et supprimé dès que la sélection change, pour qu'un lot ne
 * puisse jamais décrire une autre sélection que celle affichée.
 */

const BATCH_FILE_NAME = "prepared-analysis.json";

function batchFile(): File {
  return new File(Paths.document, BATCH_FILE_NAME);
}

export const analysisBatchRepository = {
  /** Dernier lot préparé, ou `null` s'il n'y en a pas (ou s'il est illisible). */
  async get(): Promise<PreparedAnalysisBatch | null> {
    const file = batchFile();
    if (!file.exists) return null;
    try {
      return parsePreparedBatch(await file.text());
    } catch (error) {
      console.warn("[panier] lot préparé illisible", error);
      return null;
    }
  },

  /** Enregistre le lot validé. */
  async save(batch: PreparedAnalysisBatch): Promise<void> {
    const file = batchFile();
    if (!file.exists) {
      file.create();
    }
    await file.write(JSON.stringify(batch, null, 2));
  },

  /** Oublie le lot (la sélection a changé). Ne touche à aucun fichier audio. */
  async clear(): Promise<void> {
    const file = batchFile();
    if (file.exists) file.delete();
  },
};

export type AnalysisBatchRepository = typeof analysisBatchRepository;
