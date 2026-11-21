import type { Course, ExerciseResult, ProgressSnapshot, Recording } from "@/domain/course";
import type { SubjectId } from "@/lib/subjects";

import { chapterMastery } from "./course.ts";

/**
 * Calculs purs de progression, à partir des vraies données locales :
 * enregistrements (temps, régularité), cours (chapitres étudiés, maîtrise) et
 * résultats d'exercices. Aucune valeur inventée.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Lundi 00:00 de la semaine contenant `date`. */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  // getDay(): 0 = dimanche. On ramène la semaine à lundi → dimanche.
  const offset = (day.getDay() + 6) % 7;
  return new Date(day.getTime() - offset * DAY_MS);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Minutes enregistrées pour chaque jour de la semaine courante (lundi → dimanche). */
export function weeklyMinutes(recordings: readonly Recording[], now: Date = new Date()): number[] {
  const monday = startOfWeek(now);
  const buckets = Array.from({ length: 7 }, () => 0);
  for (const recording of recordings) {
    const created = new Date(recording.createdAt);
    if (Number.isNaN(created.getTime())) continue;
    const day = startOfDay(created);
    const index = Math.round((day.getTime() - monday.getTime()) / DAY_MS);
    if (index >= 0 && index < 7) {
      buckets[index] += recording.durationMs / 60_000;
    }
  }
  return buckets.map((minutes) => Math.round(minutes));
}

/** Jours consécutifs avec au moins un enregistrement, en remontant depuis aujourd'hui. */
export function streakDays(recordings: readonly Recording[], now: Date = new Date()): number {
  const days = new Set(
    recordings
      .map((recording) => new Date(recording.createdAt))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map((date) => startOfDay(date).getTime()),
  );
  if (days.size === 0) return 0;

  let cursor = startOfDay(now);
  // Une journée sans cours ne casse pas la série si la veille en a un.
  if (!days.has(cursor.getTime())) {
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  let streak = 0;
  while (days.has(cursor.getTime())) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}

/** Nombre de jours distincts avec un enregistrement sur les 7 derniers jours. */
export function activeDays(recordings: readonly Recording[], now: Date = new Date()): number {
  const since = startOfWeek(now).getTime();
  const days = new Set<number>();
  for (const recording of recordings) {
    const created = new Date(recording.createdAt);
    if (Number.isNaN(created.getTime())) continue;
    if (created.getTime() >= since) days.add(startOfDay(created).getTime());
  }
  return days.size;
}

/** Moyenne de maîtrise par matière, sur les seuls cours existants. */
export function masteryBySubject(
  courses: readonly Course[],
): { subject: SubjectId; masteryPercent: number }[] {
  const totals = new Map<SubjectId, { sum: number; count: number }>();
  for (const course of courses) {
    for (const chapter of course.chapters) {
      const entry = totals.get(course.subject) ?? { sum: 0, count: 0 };
      entry.sum += chapterMastery(chapter);
      entry.count += 1;
      totals.set(course.subject, entry);
    }
  }
  return [...totals.entries()]
    .map(([subject, { sum, count }]) => ({
      subject,
      masteryPercent: count === 0 ? 0 : Math.round(sum / count),
    }))
    .sort((a, b) => b.masteryPercent - a.masteryPercent);
}

/** Instantané complet de progression. */
export function computeProgress(input: {
  courses: readonly Course[];
  recordings: readonly Recording[];
  results: readonly ExerciseResult[];
  revisionsDue?: number;
  now?: Date;
}): ProgressSnapshot {
  const now = input.now ?? new Date();
  const { courses, recordings, results } = input;

  const totalMs = recordings.reduce(
    (sum, recording) => sum + (Number.isFinite(recording.durationMs) ? recording.durationMs : 0),
    0,
  );
  const chapters = courses.flatMap((course) => course.chapters);
  const notions = chapters.flatMap((chapter) => chapter.notions);

  return {
    totalMinutes: Math.round(totalMs / 60_000),
    weekMinutes: weeklyMinutes(recordings, now),
    activeDays: activeDays(recordings, now),
    streakDays: streakDays(recordings, now),
    masteryBySubject: masteryBySubject(courses),
    revisionsDue: input.revisionsDue ?? 0,
    totalCourses: courses.length,
    totalChapters: chapters.length,
    studiedChapters: chapters.filter((chapter) => Boolean(chapter.studiedAt)).length,
    totalNotions: notions.length,
    notionsMastered: notions.filter((notion) => notion.masteryPercent >= 80).length,
    notionsToReview: notions.filter((notion) => notion.masteryPercent < 50).length,
    exerciseResults: results.length,
    exerciseCorrect: results.filter((result) => result.correct).length,
  };
}

/** Pourcentage de bonnes réponses, arrondi (0 quand aucun exercice). */
export function accuracyPercent(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}
