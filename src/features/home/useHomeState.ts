import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import type { Course, Recording } from "@/domain/course";
import { notionsToReview } from "@/lib/course";
import { formatRecordingDate } from "@/lib/recording";
import { activeDays, streakDays, weeklyMinutes } from "@/lib/progress";
import { courseRepository, recordingRepository } from "@/services/storage/local";

import type { HomeUiState, RecentCourse, RevisionReminder } from "./homeState";

/** Objectif quotidien affiché, en minutes (réglage produit, pas une donnée). */
const DAILY_GOAL_MINUTES = 180;

function isToday(isoDate: string, now: Date): boolean {
  const date = new Date(isoDate);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function courseDurationMinutes(course: Course, recordings: readonly Recording[]): number {
  const total = recordings
    .filter((recording) => course.recordingIds.includes(recording.id))
    .reduce((sum, recording) => sum + recording.durationMs, 0);
  return Math.round(total / 60_000);
}

function buildState(
  recordings: readonly Recording[],
  courses: readonly Course[],
  now: Date = new Date(),
): HomeUiState {
  const todayRecordings = recordings.filter((recording) => isToday(recording.createdAt, now));
  const recentCourses: RecentCourse[] = courses.slice(0, 3).map((course) => ({
    id: course.id,
    title: course.title,
    subject: course.subject,
    chapter:
      course.chapters[0]?.title ??
      `${course.chapters.length} chapitre${course.chapters.length > 1 ? "s" : ""}`,
    durationMinutes: courseDurationMinutes(course, recordings),
    analysed: true,
    timeLabel: formatRecordingDate(course.updatedAt),
  }));

  const review = notionsToReview(courses)[0];
  const revision: RevisionReminder | null = review
    ? {
        notion: review.notion.title,
        subject: review.subject,
        lastSeenLabel: review.courseTitle,
        masteryPercent: review.notion.masteryPercent,
      }
    : null;

  return {
    streakDays: streakDays(recordings, now),
    recordedMinutes: Math.round(
      todayRecordings.reduce((sum, recording) => sum + recording.durationMs, 0) / 60_000,
    ),
    goalMinutes: DAILY_GOAL_MINUTES,
    coursesToday: todayRecordings.length,
    pendingAnalyses: recordings.filter((recording) => !recording.courseId).length,
    revisionsDue: notionsToReview(courses).length,
    weekMinutes: weeklyMinutes(recordings, now),
    todayIndex: (now.getDay() + 6) % 7,
    recentCourses,
    revision,
  };
}

/**
 * État de l'accueil, relu à chaque retour sur l'onglet. `state` vaut `null`
 * tant que la première lecture n'est pas terminée.
 */
export function useHomeState(): { state: HomeUiState | null; refreshing: boolean } {
  const [state, setState] = useState<HomeUiState | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setRefreshing(true);
      void Promise.all([recordingRepository.list(), courseRepository.list()])
        .then(([recordings, courses]) => {
          if (active) setState(buildState(recordings, courses));
        })
        .catch((cause) => {
          console.warn("[accueil] données illisibles", cause);
          if (active) setState(buildState([], []));
        })
        .finally(() => {
          if (active) setRefreshing(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  return { state, refreshing };
}

/** Variante pure, utilisée par les tests et les aperçus. */
export { buildState as buildHomeState, activeDays };
