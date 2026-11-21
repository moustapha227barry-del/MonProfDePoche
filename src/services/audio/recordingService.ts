import type { SubjectId } from "@/domain/subject";

/**
 * Contrat du service d'enregistrement audio.
 *
 * IMPLÉMENTATION ACTUELLE : `src/features/recording/useRecordingSession.ts`,
 * au-dessus d'`expo-audio` (inclus dans Expo Go, micro au premier plan). Le
 * hook expose la même machine à états (démarrage, pause, reprise, arrêt),
 * écrit le fichier `.m4a` dans les documents de l'app et délègue les
 * métadonnées à `recordingRepository`.
 *
 * Ce contrat reste la description technique à respecter si l'enregistrement
 * passe un jour par un module natif ou un service de premier plan : l'écran ne
 * devra pas être réécrit.
 *
 * LIMITE IMPORTANTE : la capture en arrière-plan / écran verrouillé exige
 * `enableBackgroundRecording` (service de premier plan Android). Cette option
 * n'est pas disponible dans Expo Go : elle demande un development build puis
 * un APK EAS. Voir docs/MIGRATION-EXPO.md, section 6 bis.
 */

export type RecordingStatus = "idle" | "starting" | "recording" | "paused" | "stopped";

export type RecordingSession = {
  id: string;
  subject: SubjectId;
  /** Titre lisible enregistré dans les métadonnées. */
  title: string;
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
