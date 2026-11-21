/** Affiche une durée en minutes sous une forme lisible : « 45 min », « 2 h 15 ». */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining === 0 ? `${hours} h` : `${hours} h ${String(remaining).padStart(2, "0")}`;
}

/** Chronomètre d'enregistrement : « 00:06,54 » (minutes, secondes, centièmes). */
export function formatRecordingTimer(elapsedMs: number): string {
  const totalCentis = Math.floor(elapsedMs / 10);
  const minutes = Math.floor(totalCentis / 6000);
  const seconds = Math.floor((totalCentis % 6000) / 100);
  const centis = totalCentis % 100;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(
    centis,
  ).padStart(2, "0")}`;
}
