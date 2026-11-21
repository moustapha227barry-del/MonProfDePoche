import assert from "node:assert/strict";
import test from "node:test";

import type { ExerciseResult, Recording } from "../src/domain/course.ts";
import {
  accuracyPercent,
  activeDays,
  computeProgress,
  masteryBySubject,
  startOfWeek,
  streakDays,
  weeklyMinutes,
} from "../src/lib/progress.ts";
import { makeCourse } from "./fixtures.ts";

function recording(id: string, isoDate: string, minutes: number): Recording {
  return {
    id,
    title: `Cours ${id}`,
    subject: "mathematics",
    fileName: `cours-${id}.m4a`,
    fileUri: `file:///documents/Audio/cours-${id}.m4a`,
    durationMs: minutes * 60_000,
    createdAt: isoDate,
  };
}

// Mercredi 25 novembre 2026 : la semaine commence le lundi 23.
const NOW = new Date(2026, 10, 25, 12, 0, 0);

const WEEK = [
  recording("a", new Date(2026, 10, 23, 10, 0).toISOString(), 30),
  recording("b", new Date(2026, 10, 24, 9, 0).toISOString(), 45),
  recording("c", new Date(2026, 10, 25, 8, 0).toISOString(), 15),
];

test("la semaine commence le lundi", () => {
  const monday = startOfWeek(NOW);
  assert.equal(monday.getDay(), 1);
  assert.equal(monday.getDate(), 23);
  assert.equal(monday.getHours(), 0);
});

test("les minutes sont réparties sur les sept jours de la semaine", () => {
  assert.deepEqual(weeklyMinutes(WEEK, NOW), [30, 45, 15, 0, 0, 0, 0]);

  const withOld = [...WEEK, recording("old", new Date(2026, 10, 20, 10, 0).toISOString(), 60)];
  assert.deepEqual(weeklyMinutes(withOld, NOW), [30, 45, 15, 0, 0, 0, 0]);
});

test("la série de jours consécutifs s'arrête au premier jour vide", () => {
  assert.equal(streakDays(WEEK, NOW), 3);

  const missingYesterday = [
    recording("a", new Date(2026, 10, 22, 10, 0).toISOString(), 10),
    recording("b", new Date(2026, 10, 23, 10, 0).toISOString(), 10),
    recording("c", new Date(2026, 10, 25, 10, 0).toISOString(), 10),
  ];
  assert.equal(streakDays(missingYesterday, NOW), 1);

  assert.equal(streakDays([], NOW), 0);
});

test("les jours actifs comptent les jours distincts de la semaine", () => {
  assert.equal(activeDays(WEEK, NOW), 3);
  assert.equal(
    activeDays([...WEEK, recording("d", new Date(2026, 10, 24, 18, 0).toISOString(), 5)], NOW),
    3,
  );
});

test("la maîtrise moyenne est calculée par matière", () => {
  const physics = makeCourse({
    id: "physics-1",
    subject: "physics",
    chapters: [
      {
        id: "p1",
        title: "Dynamique",
        summary: "",
        sections: [],
        notions: [{ id: "n", title: "Inertie", masteryPercent: 100 }],
      },
    ],
  });

  const bySubject = masteryBySubject([makeCourse(), physics]);
  assert.equal(bySubject.length, 2);
  assert.equal(bySubject.find((item) => item.subject === "physics")?.masteryPercent, 100);
  assert.equal(bySubject.find((item) => item.subject === "mathematics")?.masteryPercent, 63);
});

test("l'instantané global agrège enregistrements, cours et exercices", () => {
  const results: ExerciseResult[] = [
    {
      id: "r1",
      courseId: "course-1",
      notionId: "n1",
      correct: true,
      answeredAt: "2026-11-24T10:00:00.000Z",
    },
    {
      id: "r2",
      courseId: "course-1",
      notionId: "n2",
      correct: false,
      answeredAt: "2026-11-24T10:05:00.000Z",
    },
  ];

  const snapshot = computeProgress({
    courses: [makeCourse()],
    recordings: WEEK,
    results,
    revisionsDue: 2,
    now: NOW,
  });

  assert.equal(snapshot.totalMinutes, 90);
  assert.deepEqual(snapshot.weekMinutes, [30, 45, 15, 0, 0, 0, 0]);
  assert.equal(snapshot.activeDays, 3);
  assert.equal(snapshot.streakDays, 3);
  assert.equal(snapshot.totalCourses, 1);
  assert.equal(snapshot.totalChapters, 2);
  assert.equal(snapshot.studiedChapters, 1);
  assert.equal(snapshot.totalNotions, 2);
  assert.equal(snapshot.notionsMastered, 1);
  assert.equal(snapshot.notionsToReview, 1);
  assert.equal(snapshot.exerciseResults, 2);
  assert.equal(snapshot.exerciseCorrect, 1);
  assert.equal(snapshot.revisionsDue, 2);

  assert.equal(accuracyPercent(snapshot.exerciseCorrect, snapshot.exerciseResults), 50);
  assert.equal(accuracyPercent(0, 0), 0);
});
