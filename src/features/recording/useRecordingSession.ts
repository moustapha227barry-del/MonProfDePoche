import { File } from "expo-file-system";
import {
  AudioQuality,
  IOSOutputFormat,
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Recording } from "@/domain/course";
import { getSubject, type SubjectId } from "@/domain/subject";
import {
  RECORDING_EXTENSION,
  buildRecordingFileName,
  emptyLevels,
  formatRecordingTitle,
  normalizeMetering,
  pushLevel,
} from "@/lib/recording";
import { recordingRepository } from "@/services/storage/recordingRepository";

/**
 * Enregistrement réel du microphone, au premier plan uniquement.
 *
 * `expo-audio` écrit un fichier AAC (`.m4a`) dans le dossier **documents** de
 * l'application, sous un nom déterministe ; ce hook tient la machine à états
 * (démarrage → pause → reprise → arrêt), le chronomètre et le niveau micro,
 * puis enregistre les métadonnées via `recordingRepository`.
 *
 * Aucune capture n'est simulée : sans micro, sans permission ou sans fichier,
 * l'état repasse à `idle` et une erreur explicite est renvoyée à l'écran.
 */

export type RecordingPhase = "idle" | "starting" | "recording" | "paused" | "saving";

export type StartRecordingInput = {
  subject: SubjectId;
  /** Titre libre ; à défaut, « Mathématiques · 21/11/2026 14:05 ». */
  title?: string;
};

export type StartRecordingResult =
  | { ok: true }
  | { ok: false; reason: "permission-denied" | "error"; message: string };

export type MicrophonePermission = {
  denied: boolean;
  canAskAgain: boolean;
};

/** AAC 44,1 kHz mono, 96 kbit/s : suffisant pour la voix, économe en stockage. */
export const RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  extension: RECORDING_EXTENSION,
  sampleRate: 44100,
  numberOfChannels: 1,
  bitRate: 96000,
  isMeteringEnabled: true,
  android: {
    ...RecordingPresets.HIGH_QUALITY.android,
    extension: RECORDING_EXTENSION,
    outputFormat: "mpeg4",
    audioEncoder: "aac",
  },
  ios: {
    ...RecordingPresets.HIGH_QUALITY.ios,
    extension: RECORDING_EXTENSION,
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.HIGH,
  },
  web: {
    mimeType: "audio/mp4",
    bitsPerSecond: 96000,
  },
};

type ActiveSession = {
  id: string;
  subject: SubjectId;
  title: string;
  fileName: string;
};

function newRecordingId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Erreur inconnue";
}

export function useRecordingSession() {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 100);

  const [phase, setPhase] = useState<RecordingPhase>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => emptyLevels());
  const [permission, setPermission] = useState<MicrophonePermission>({
    denied: false,
    canAskAgain: true,
  });
  const [error, setError] = useState<string | null>(null);

  const startedAtRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const sessionRef = useRef<ActiveSession | null>(null);

  // Chronomètre : n'avance que pendant la capture (les pauses sont exclues).
  useEffect(() => {
    if (phase !== "recording") return;
    const interval = setInterval(() => {
      const startedAt = startedAtRef.current;
      if (startedAt === null) return;
      setElapsedMs(accumulatedRef.current + (Date.now() - startedAt));
    }, 100);
    return () => clearInterval(interval);
  }, [phase]);

  // Onde sonore : niveau réel renvoyé par le micro, une barre par mesure.
  const metering = recorderState.metering;
  useEffect(() => {
    if (phase !== "recording") return;
    setLevels((current) => pushLevel(current, normalizeMetering(metering)));
  }, [metering, phase]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const current = await getRecordingPermissionsAsync();
      if (current.granted) {
        setPermission({ denied: false, canAskAgain: current.canAskAgain });
        return true;
      }
      if (!current.canAskAgain) {
        setPermission({ denied: true, canAskAgain: false });
        return false;
      }
      const asked = await requestRecordingPermissionsAsync();
      setPermission({ denied: !asked.granted, canAskAgain: asked.canAskAgain });
      return asked.granted;
    } catch (cause) {
      console.warn("[enregistrement] permission micro", cause);
      setPermission({ denied: true, canAskAgain: false });
      return false;
    }
  }, []);

  const start = useCallback(
    async (input: StartRecordingInput): Promise<StartRecordingResult> => {
      if (phase !== "idle") {
        return { ok: false, reason: "error", message: "Un enregistrement est déjà en cours." };
      }

      setError(null);
      setPhase("starting");

      try {
        const granted = await requestPermission();
        if (!granted) {
          setPhase("idle");
          return {
            ok: false,
            reason: "permission-denied",
            message:
              "Sans accès au microphone, aucun cours ne peut être enregistré. Autorisez le micro puis réessayez.",
          };
        }

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        });

        const startedAt = new Date();
        const fileName = buildRecordingFileName(input.subject, startedAt);

        // Le fichier va directement dans les documents de l'app : pas de copie
        // depuis le cache, donc aucun risque de perte si le système nettoie.
        await recorder.prepareToRecordAsync({
          ...RECORDING_OPTIONS,
          directory: "document",
          fileName,
        });
        recorder.record();

        sessionRef.current = {
          id: newRecordingId(),
          subject: input.subject,
          title:
            input.title?.trim() ||
            formatRecordingTitle(getSubject(input.subject).label, startedAt),
          fileName,
        };
        accumulatedRef.current = 0;
        startedAtRef.current = Date.now();
        setElapsedMs(0);
        setLevels(emptyLevels());
        setPhase("recording");
        return { ok: true };
      } catch (cause) {
        console.warn("[enregistrement] démarrage impossible", cause);
        startedAtRef.current = null;
        sessionRef.current = null;
        accumulatedRef.current = 0;
        setPhase("idle");
        setElapsedMs(0);
        setError(`Le microphone n'a pas pu démarrer : ${errorMessage(cause)}`);
        return { ok: false, reason: "error", message: errorMessage(cause) };
      }
    },
    [phase, recorder, requestPermission],
  );

  const pause = useCallback(() => {
    if (phase !== "recording") return;
    if (startedAtRef.current !== null) {
      accumulatedRef.current += Date.now() - startedAtRef.current;
      startedAtRef.current = null;
      setElapsedMs(accumulatedRef.current);
    }
    recorder.pause();
    setPhase("paused");
  }, [phase, recorder]);

  const resume = useCallback(() => {
    if (phase !== "paused") return;
    startedAtRef.current = Date.now();
    recorder.record();
    setPhase("recording");
  }, [phase, recorder]);

  const stop = useCallback(async (): Promise<Recording | null> => {
    const session = sessionRef.current;
    if (!session || (phase !== "recording" && phase !== "paused")) return null;

    setPhase("saving");
    if (startedAtRef.current !== null) {
      accumulatedRef.current += Date.now() - startedAtRef.current;
      startedAtRef.current = null;
    }
    const durationMs = accumulatedRef.current;
    setElapsedMs(durationMs);

    let fileUri: string | null = null;
    try {
      await recorder.stop();
      // Sur Android, `uri` vaut "" quand aucun fichier n'a été ouvert : ce
      // n'est pas une URI valide, il faut la traiter comme absente.
      const rawUri = recorder.uri || recorder.getStatus().url || null;
      fileUri = rawUri && rawUri.length > 0 ? rawUri : null;
    } catch (cause) {
      console.warn("[enregistrement] arrêt impossible", cause);
      setError(`L'enregistrement n'a pas pu être arrêté proprement : ${errorMessage(cause)}`);
    }

    try {
      await setAudioModeAsync({ allowsRecording: false });
    } catch (cause) {
      console.warn("[enregistrement] mode audio non réinitialisé", cause);
    }

    sessionRef.current = null;
    accumulatedRef.current = 0;
    startedAtRef.current = null;
    setElapsedMs(0);
    setLevels(emptyLevels());
    setPhase("idle");

    if (!fileUri) {
      setError("Le fichier audio n'a pas pu être récupéré : rien n'a été sauvegardé.");
      return null;
    }

    // Vérification réelle sur le disque : si le `.m4a` n'existe pas (arrêt
    // avorté, stockage plein), on ne crée pas de métadonnées fantômes.
    try {
      if (!new File(fileUri).exists) {
        setError(
          "Le fichier audio n'a pas été écrit sur le téléphone : rien n'a été sauvegardé.",
        );
        return null;
      }
    } catch (cause) {
      console.warn("[enregistrement] vérification du fichier impossible", cause);
    }

    const recording: Recording = {
      id: session.id,
      title: session.title,
      subject: session.subject,
      fileName: fileUri.split("/").pop() ?? `${session.fileName}${RECORDING_EXTENSION}`,
      fileUri,
      durationMs,
      createdAt: new Date().toISOString(),
    };

    try {
      await recordingRepository.save(recording);
    } catch (cause) {
      console.warn("[enregistrement] métadonnées non sauvegardées", cause);
      setError(
        "Le fichier audio est bien sur le téléphone, mais ses informations n'ont pas pu être enregistrées.",
      );
      return null;
    }

    return recording;
  }, [phase, recorder]);

  const clearError = useCallback(() => setError(null), []);

  return {
    phase,
    elapsedMs,
    levels,
    error,
    permission,
    /** `true` dès qu'un fichier est ouvert : quitter l'écran doit être confirmé. */
    isActive: phase === "recording" || phase === "paused" || phase === "saving",
    requestPermission,
    start,
    pause,
    resume,
    stop,
    clearError,
  };
}
