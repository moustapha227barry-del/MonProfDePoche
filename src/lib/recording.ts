import type { Recording } from "@/domain/course";
import type { SubjectId } from "@/domain/subject";

/**
 * Helpers purs de l'enregistrement audio : nom de fichier, titre par défaut,
 * normalisation du niveau micro et lecture de l'index local.
 *
 * Aucun import React Native ni Expo ici : ces fonctions sont testables seules
 * (voir `tests/recording.test.ts`) et réutilisables par le panier plus tard.
 */

/** Extension et type MIME imposés par la phase d'enregistrement (AAC dans un conteneur MP4). */
export const RECORDING_EXTENSION = ".m4a";
export const RECORDING_MIME_TYPE = "audio/mp4";
export const RECORDING_FILE_PREFIX = "cours";

/** Nombre de barres affichées par l'onde sonore. */
export const WAVEFORM_BAR_COUNT = 32;

/** En dessous de ce niveau (en dB), l'onde est considérée comme silencieuse. */
const METERING_FLOOR_DB = -60;

function pad(value: number, size = 2): string {
  return String(value).padStart(size, "0");
}

/** `technicalDrawing` → `technical-drawing`. */
function subjectSlug(subject: SubjectId): string {
  return subject.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Nom de fichier déterministe et sûr : `cours-mathematiques-20261121-140512`.
 *
 * Le nom ne contient ni accent, ni espace, ni séparateur de dossier : il peut
 * être passé tel quel à `expo-audio` (`fileName`) puis cité dans les métadonnées.
 */
export function buildRecordingFileName(subject: SubjectId, date: Date): string {
  const stamp =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `${RECORDING_FILE_PREFIX}-${subjectSlug(subject)}-${stamp}`;
}

/** Titre lisible proposé par défaut : « Mathématiques · 21/11/2026 14:05 ». */
export function formatRecordingTitle(subjectLabel: string, date: Date): string {
  const day = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return `${subjectLabel} · ${day} ${time}`;
}

/**
 * Convertit un niveau micro en dB (≈ -160 → 0) en une hauteur de barre 0 → 1.
 * Les valeurs absentes ou aberrantes retombent sur 0 (silence).
 */
export function normalizeMetering(decibels: number | null | undefined): number {
  if (decibels === null || decibels === undefined || !Number.isFinite(decibels)) return 0;
  if (decibels >= 0) return 1;
  if (decibels <= METERING_FLOOR_DB) return 0;
  return (decibels - METERING_FLOOR_DB) / -METERING_FLOOR_DB;
}

/** Ajoute un niveau à droite de l'onde et retire les plus anciens. */
export function pushLevel(
  levels: readonly number[],
  level: number,
  max: number = WAVEFORM_BAR_COUNT,
): number[] {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(level) ? level : 0));
  const next = [...levels, clamped];
  return next.length > max ? next.slice(next.length - max) : next;
}

/** Onde au repos : `count` barres plates. */
export function emptyLevels(count: number = WAVEFORM_BAR_COUNT): number[] {
  return Array.from({ length: count }, () => 0);
}

/** Durée lisible pour la liste : « 45 s », « 12 min 34 s », « 1 h 02 min ». */
export function formatRecordingDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  if (totalSeconds < 60) return `${totalSeconds} s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes} min ${pad(seconds)} s`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${pad(minutes % 60)} min`;
}

/** Date lisible de la liste : « 21/11/2026 · 14:05 ». */
export function formatRecordingDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} · ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function isRecording(value: unknown): value is Recording {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.title === "string" &&
    typeof candidate.subject === "string" &&
    typeof candidate.fileUri === "string" &&
    candidate.fileUri.length > 0 &&
    typeof candidate.fileName === "string" &&
    typeof candidate.durationMs === "number" &&
    Number.isFinite(candidate.durationMs) &&
    typeof candidate.createdAt === "string"
  );
}

/**
 * Lit l'index JSON local en ignorant les entrées corrompues.
 * Un fichier absent ou illisible renvoie une liste vide : l'écran reste utilisable.
 */
export function parseRecordingIndex(raw: string): Recording[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isRecording);
}
