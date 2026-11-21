import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useState } from "react";

import type { Recording } from "@/domain/course";

/**
 * Lecture des enregistrements, un seul à la fois.
 *
 * `expo-audio` partage un lecteur unique par écran : changer de fichier
 * remplace la source. Aucune donnée ne quitte le téléphone, le chemin local
 * est passé directement.
 */
export function useRecordingPlayback() {
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Fin de lecture : on oublie le fichier courant pour revenir à l'état repos.
  useEffect(() => {
    if (status.didJustFinish) setCurrentId(null);
  }, [status.didJustFinish]);

  const toggle = useCallback(
    async (recording: Recording) => {
      if (currentId === recording.id) {
        if (status.playing) player.pause();
        else player.play();
        return;
      }

      try {
        // Mode lecture : on coupe l'entrée micro et on autorise le son même en
        // mode silencieux, sinon la lecture serait inaudible sur Android.
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        player.replace(recording.fileUri);
        setCurrentId(recording.id);
        player.play();
      } catch (error) {
        console.warn("[lecture] fichier illisible", error);
        setCurrentId(null);
      }
    },
    [currentId, player, status.playing],
  );

  const stop = useCallback(() => {
    player.pause();
    setCurrentId(null);
  }, [player]);

  return {
    currentId,
    playing: currentId !== null && status.playing,
    positionMs: currentId ? Math.round((status.currentTime ?? 0) * 1000) : 0,
    durationMs: currentId ? Math.round((status.duration ?? 0) * 1000) : 0,
    error: status.error,
    toggle,
    stop,
  };
}
