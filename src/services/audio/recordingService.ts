import type { SubjectId } from "@/domain/subject";

/**
 * Contrat du service d'enregistrement audio.
 *
 * OBJECTIF : l'écran d'enregistrement ne connaîtra que cette interface. On
 * pourra changer la technologie (expo-audio, module natif) sans le réécrire.
 *
 * IMPLÉMENTATION PRÉVUE : `expo-audio` (inclus dans Expo Go pour une capture
 * simple, micro au premier plan). L'API réelle sera branchée à l'étape
 * « enregistrement » ; ce fichier ne prétend pas fonctionner aujourd'hui.
 *
 * LIMITE IMPORTANTE : la capture en arrière-plan / écran verrouillé exige
 * `enableBackgroundRecording` (service de premier plan Android). Cette option
 * n'est pas disponible dans Expo Go : elle demande un development build puis
 * un APK EAS. Voir docs/MIGRATION-EXPO.md.
 */

export type RecordingStatus = "idle" | "starting" | "recording" | "paused" | "stopped";

export type RecordingSession = {
  id: string;
  subject: SubjectId;
  /** URI locale du fichier (cache ou documents de l'application). */
  fileUri: string;
  startedAt: number;
  durationMs: number;
};

export type StartRecordingInput = {
  subject: SubjectId;
  /** Métadonnées facultatives, utiles pour nommer le cours ensuite. */
  title?: string;
};

export interface RecordingService {
  /** Demande la permission micro ; renvoie false si refusée. */
  requestPermission(): Promise<boolean>;
  start(input: StartRecordingInput): Promise<RecordingSession>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  /** Termine la capture et renvoie la session prête à être analysée. */
  stop(): Promise<RecordingSession>;
  getStatus(): RecordingStatus;
  /** Durée écoulée, mise à jour par le service pour le chronomètre. */
  getElapsedMs(): number;
}
