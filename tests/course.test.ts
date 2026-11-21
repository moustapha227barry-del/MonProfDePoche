import assert from "node:assert/strict";
import test from "node:test";

import { makeCourse } from "./fixtures.ts";
import {
  courseMatches,
  courseStats,
  markChapterStudied,
  normalizeForSearch,
  notionsToReview,
  parseStoredCourse,
  renameCourse,
  searchCourses,
  setNotionMastery,
} from "../src/lib/course.ts";

test("la recherche ignore accents, casse et filtre par matière", () => {
  assert.equal(normalizeForSearch("  Dérivées  "), "derivees");
  const courses = [
    makeCourse(),
    makeCourse({
      id: "course-2",
      title: "Les lois de Newton",
      subject: "physics",
      chapters: [
        {
          id: "c1",
          title: "Dynamique",
          summary: "Force et mouvement",
          sections: [{ id: "s", title: "Principe", content: "Toute force..." }],
          notions: [{ id: "n", title: "Inertie", masteryPercent: 0 }],
        },
      ],
    }),
  ];

  assert.equal(searchCourses(courses, "derivees").length, 1);
  assert.equal(searchCourses(courses, "INERTIE").length, 1);
  assert.equal(searchCourses(courses, "force", "mathematics").length, 0);
  assert.equal(searchCourses(courses, "force", "physics").length, 1);
  assert.equal(searchCourses(courses, "").length, 2);
  assert.equal(courseMatches(courses[0], "limite en un point"), true);
});

test("les statistiques d'un cours reflètent son contenu", () => {
  const stats = courseStats(makeCourse());
  assert.equal(stats.chapters, 2);
  assert.equal(stats.sections, 1);
  assert.equal(stats.notions, 2);
  assert.equal(stats.studiedChapters, 1);
  // Chapitre 1 : (40 + 90) / 2 = 65, chapitre 2 étudié sans notion : 60.
  assert.equal(stats.masteryPercent, 63);
});

test("les notions à revoir sont triées de la plus faible à la plus forte", () => {
  const courses = [makeCourse()];
  const review = notionsToReview(courses, 50);
  assert.equal(review.length, 1);
  assert.equal(review[0].notion.title, "Dérivée");
  assert.equal(review[0].courseTitle, "Fonctions dérivées");
});

test("renommer un cours ne le mute pas et ignore un titre vide", () => {
  const course = makeCourse();
  const renamed = renameCourse(course, "  Dérivées et tangentes  ", new Date("2026-11-22T09:00:00Z"));
  assert.equal(renamed.title, "Dérivées et tangentes");
  assert.equal(renamed.updatedAt, "2026-11-22T09:00:00.000Z");
  assert.equal(course.title, "Fonctions dérivées", "l'original reste intact");
  assert.equal(renameCourse(course, "   ").title, course.title);
});

test("marquer un chapitre étudié est idempotent", () => {
  const at = new Date("2026-11-22T09:00:00Z");
  const once = markChapterStudied(makeCourse(), "chapter-1", at);
  assert.equal(once.chapters[0].studiedAt, at.toISOString());

  const twice = markChapterStudied(once, "chapter-1", new Date("2026-11-23T09:00:00Z"));
  assert.equal(twice.chapters[0].studiedAt, at.toISOString());
  assert.equal(twice.chapters[1].studiedAt, "2026-11-20T10:00:00.000Z");
});

test("la maîtrise d'une notion est bornée entre 0 et 100", () => {
  const high = setNotionMastery(makeCourse(), "n1", 150);
  assert.equal(high.chapters[0].notions[0].masteryPercent, 100);

  const low = setNotionMastery(makeCourse(), "n1", -20);
  assert.equal(low.chapters[0].notions[0].masteryPercent, 0);

  const untouched = setNotionMastery(makeCourse(), "inconnu", 50);
  assert.equal(untouched.chapters[0].notions[0].masteryPercent, 40);
});

test("le stockage refuse les cours incomplets et complète les anciens", () => {
  const course = makeCourse();
  assert.deepEqual(parseStoredCourse(course)?.title, course.title);

  assert.equal(parseStoredCourse(null), null);
  assert.equal(parseStoredCourse({}), null);
  assert.equal(parseStoredCourse({ ...course, title: "" }), null);
  assert.equal(parseStoredCourse({ ...course, subject: "svt" }), null);
  assert.equal(parseStoredCourse({ ...course, chapters: [] }), null);
  assert.equal(parseStoredCourse({ ...course, chapters: [{ title: "" }] }), null);

  // Ancien format sans sections ni incertitudes : complété sans perte.
  const legacy = parseStoredCourse({
    ...course,
    chapters: [{ title: "Ancien chapitre", summary: "Résumé", notions: [{ title: "Notion" }] }],
  });
  assert.ok(legacy);
  assert.deepEqual(legacy.chapters[0].sections, []);
  assert.deepEqual(legacy.uncertainties, []);
  assert.equal(legacy.chapters[0].notions[0].masteryPercent, 0);
  assert.deepEqual(legacy.recordingIds, ["rec-1"]);
});
