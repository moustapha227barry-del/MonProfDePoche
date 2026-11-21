import type { Recording } from "@/domain/course";
import type { SubjectId } from "@/domain/subject";

/**
 * Helpers purs du panier d'analyse.
 *
 * Toutes les fonctions de ce fichier sont testables seules sous Node
 * (`tests/basket.test.ts`) : elles ne touchent ni au disque, ni à React, ni à
 * Expo. Le repository se contente de lire/écrire le résultat.
 *
 * Le panier ne stocke pas de copie des fichiers audio : il ne fait que marquer
 * des enregistrements existants avec `addedToBasketAt` dans `recordings.json`.
 * Retirer un fichier du panier ne supprime donc jamais l'audio.
 */

/** Limite métier : 5 fichiers par analyse (miroir de MAX_RECORDINGS_PER_ANALYSIS). */
export const MAX_BASKET_SIZE = 5;

/** Type MIME des fichiers produits par expo-audio (miroir de RECORDING_MIME_TYPE). */
export const BASKET_AUDIO_MIME_TYPE = "audio/mp4";

/** Résultat d'un appui sur un enregistrement : la sélection et un éventuel refus. */
export type BasketToggle = {
  ids: string[];
  /** Vrai quand l'ajout est refusé parce que le panier est déjà complet. */
  rejected: boolean;
};

/**
 * Ajoute ou retire un enregistrement, sans jamais dépasser `max` fichiers.
 * Un identifiant inconnu ou vide laisse la sélection inchangée.
 */
export function toggleBasketSelection(
  ids: readonly string[],
  id: string,
  max: number = MAX_BASKET_SIZE,
): BasketToggle {
  if (!id) return { ids: [...ids], rejected: false };
  if (ids.includes(id)) return { ids: ids.filter((item) => item !== id), rejected: false };
  if (ids.length >= max) return { ids: [...ids], rejected: true };
  return { ids: [...ids, id], rejected: false };
}

/** Compteur affiché tel quel dans l'interface : « 0/5 », « 3/5 ». */
export function basketCounterLabel(count: number, max: number = MAX_BASKET_SIZE): string {
  const safeCount = Math.max(0, Math.min(max, Math.round(count)));
  return `${safeCount}/${max}`;
}

/** Résumé lisible sous le compteur. */
export function basketSelectionSummary(count: number): string {
  if (count <= 0) return "Aucun fichier sélectionné";
  return count === 1 ? "1 fichier sélectionné" : `${count} fichiers sélectionnés`;
}

/** Durée cumulée d'une sélection, en millisecondes. */
export function sumDurationMs(recordings: readonly Recording[]): number {
  return recordings.reduce(
    (total, recording) =>
      total + (Number.isFinite(recording.durationMs) ? Math.max(0, recording.durationMs) : 0),
    0,
  );
}

/**
 * Marque les enregistrements `ids` comme présents dans le panier.
 * Les autres entrées sont renvoyées telles quelles : rien n'est supprimé.
 */
export function addRecordingsToBasket(
  recordings: readonly Recording[],
  ids: readonly string[],
  at: string,
): Recording[] {
  const selected = new Set(ids);
  return recordings.map((recording) =>
    selected.has(recording.id) ? { ...recording, addedToBasketAt: at } : recording,
  );
}

/**
 * Retire les enregistrements `ids` du panier en effaçant seulement
 * `addedToBasketAt`. Le fichier audio et toutes les autres métadonnées restent
 * intacts, et la liste garde exactement la même longueur.
 */
export function removeRecordingsFromBasket(
  recordings: readonly Recording[],
  ids: readonly string[],
): Recording[] {
  const removed = new Set(ids);
  return recordings.map((recording) => {
    if (!removed.has(recording.id)) return recording;
    const copy = { ...recording };
    delete copy.addedToBasketAt;
    return copy;
  });
}

/** Compare deux sélections ordonnées (pour savoir si un lot préparé est encore valable). */
export function sameSelection(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((id, index) => id === b[index]);
}

/** Un fichier du lot, décrit sans exposer le contenu audio au reste de l'application. */
export type BasketFile = {
  recordingId: string;
  title: string;
  fileName: string;
  fileUri: string;
  subject: SubjectId;
  durationMs: number;
  mimeType: string;
};

/**
 * Lot prêt à être analysé. Il ne contient que des références aux fichiers
 * locaux : aucune donnée n'est envoyée nulle part à cette étape.
 */
export type PreparedAnalysisBatch = {
  id: string;
  createdAt: string;
  status: "ready";
  maxFiles: number;
  files: BasketFile[];
  totalDurationMs: number;
};

export type BatchPreparation =
  | { ok: true; batch: PreparedAnalysisBatch }
  | { ok: false; message: string; missingIds: string[] };

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Identifiant lisible et triable : `lot-20261121-140512`. */
export function buildBatchId(now: Date = new Date()): string {
  const stamp =
    `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}` +
    `-${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
  return `lot-${stamp}`;
}

/**
 * Valide la sélection et construit le lot. Refuse explicitement :
 * - une sélection vide ;
 * - plus de 5 fichiers ;
 * - un fichier dont l'audio a disparu du téléphone (`missingIds`).
 *
 * Aucune analyse n'est lancée : cette fonction ne fait que préparer et décrire
 * le lot que le futur moteur IA consommera.
 */
export function prepareAnalysisBatch(
  recordings: readonly Recording[],
  options: { missingIds?: readonly string[]; now?: Date } = {},
): BatchPreparation {
  const missingIds = options.missingIds ?? [];
  const now = options.now ?? new Date();

  if (recordings.length === 0) {
    return {
      ok: false,
      missingIds: [],
      message: "Sélectionne au moins un enregistrement avant de préparer l’analyse.",
    };
  }

  if (recordings.length > MAX_BASKET_SIZE) {
    return {
      ok: false,
      missingIds: [],
      message: `Le panier contient ${recordings.length} fichiers : ${MAX_BASKET_SIZE} maximum par analyse.`,
    };
  }

  const missing = recordings.filter((recording) => missingIds.includes(recording.id));
  if (missing.length > 0) {
    const titles = missing.map((recording) => `« ${recording.title} »`).join(", ");
    return {
      ok: false,
      missingIds: missing.map((recording) => recording.id),
      message:
        missing.length === 1
          ? `Ce fichier est introuvable sur le téléphone : ${titles}. Retire-le du panier pour continuer.`
          : `Ces ${missing.length} fichiers sont introuvables sur le téléphone : ${titles}. Retire-les du panier pour continuer.`,
    };
  }

  const files: BasketFile[] = recordings.map((recording) => ({
    recordingId: recording.id,
    title: recording.title,
    fileName: recording.fileName,
    fileUri: recording.fileUri,
    subject: recording.subject,
    durationMs: recording.durationMs,
    mimeType: BASKET_AUDIO_MIME_TYPE,
  }));

  return {
    ok: true,
    batch: {
      id: buildBatchId(now),
      createdAt: now.toISOString(),
      status: "ready",
      maxFiles: MAX_BASKET_SIZE,
      files,
      totalDurationMs: sumDurationMs(recordings),
    },
  };
}

function isBasketFile(value: unknown): value is BasketFile {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.recordingId === "string" &&
    candidate.recordingId.length > 0 &&
    typeof candidate.title === "string" &&
    typeof candidate.fileName === "string" &&
    typeof candidate.fileUri === "string" &&
    candidate.fileUri.length > 0 &&
    typeof candidate.subject === "string" &&
    typeof candidate.durationMs === "number" &&
    Number.isFinite(candidate.durationMs) &&
    typeof candidate.mimeType === "string"
  );
}

/**
 * Relit un lot enregistré sur le téléphone. Un contenu absent, corrompu ou
 * incomplet renvoie `null` : l'écran reste utilisable et peut reproposer la
 * préparation.
 */
export function parsePreparedBatch(raw: string): PreparedAnalysisBatch | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const candidate = parsed as Record<string, unknown>;

  if (typeof candidate.id !== "string" || candidate.id.length === 0) return null;
  if (typeof candidate.createdAt !== "string") return null;
  if (candidate.status !== "ready") return null;
  if (!Array.isArray(candidate.files) || candidate.files.length === 0) return null;
  if (!candidate.files.every(isBasketFile)) return null;
  if (typeof candidate.totalDurationMs !== "number" || !Number.isFinite(candidate.totalDurationMs)) {
    return null;
  }

  return {
    id: candidate.id,
    createdAt: candidate.createdAt,
    status: "ready",
    maxFiles:
      typeof candidate.maxFiles === "number" && candidate.maxFiles > 0
        ? candidate.maxFiles
        : MAX_BASKET_SIZE,
    files: candidate.files,
    totalDurationMs: candidate.totalDurationMs,
  };
}
