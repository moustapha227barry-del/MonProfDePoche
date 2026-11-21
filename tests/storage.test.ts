import assert from "node:assert/strict";
import test from "node:test";

import type { ExerciseResult } from "../src/domain/course.ts";
import { COURSES_FILE, createCourseRepository } from "../src/services/storage/courseRepository.ts";
import { createMemoryJsonStore } from "../src/services/storage/jsonStore.ts";
import {
  PROFILE_FILE,
  createProfileRepository,
  defaultProfile,
} from "../src/services/storage/profileRepository.ts";
import {
  PROGRESS_FILE,
  createProgressRepository,
} from "../src/services/storage/progressRepository.ts";
import { makeCourse } from "./fixtures.ts";

/**
 * Tests d'intégration : les repositories sont exécutés sur un stockage
 * mémoire, avec les mêmes sérialisations que sur le téléphone. Ils vérifient
 * la persistance entre deux instances (équivalent d'un redémarrage).
 */

test("un cours enregistré survit à une nouvelle instance du repository", async () => {
  const store = createMemoryJsonStore();
  const first = createCourseRepository(store);

  await first.save(makeCourse());
  assert.equal((await first.list()).length, 1);
  assert.equal((await first.list())[0].chapters.length, 2);

  // Nouvelle instance : simule la réouverture de l'application.
  const second = createCourseRepository(store);
  const courses = await second.list();
  assert.equal(courses.length, 1);
  assert.equal(courses[0].title, "Fonctions dérivées");
  assert.deepEqual(courses[0].recordingIds, ["rec-1"]);
  assert.equal(await second.get("course-1").then((course) => course?.subject), "mathematics");
  assert.equal(await second.get("inconnu"), null);
});

test("renommer, marquer étudié et noter une notion sont persistés", async () => {
  const store = createMemoryJsonStore();
  const repository = createCourseRepository(store);
  await repository.save(makeCourse());

  const renamed = await repository.rename("course-1", "Dérivées approfondies");
  assert.equal(renamed?.title, "Dérivées approfondies");
  assert.equal(await repository.rename("inconnu", "x"), null);
  assert.equal(await repository.rename("course-1", "   "), null, "un titre vide est refusé");

  await repository.markChapterStudied("course-1", "chapter-1");
  const mastered = await repository.setNotionMastery("course-1", "n1", 85);

  const reloaded = await createCourseRepository(store).get("course-1");
  assert.ok(reloaded);
  assert.equal(reloaded.title, "Dérivées approfondies");
  assert.ok(reloaded.chapters[0].studiedAt);
  assert.equal(reloaded.chapters[0].notions[0].masteryPercent, 85);
  assert.equal(mastered?.chapters[0].notions[0].masteryPercent, 85);

  await repository.remove("course-1");
  assert.deepEqual(await createCourseRepository(store).list(), []);
});

test("un fichier de cours corrompu n'empêche pas l'application de démarrer", async () => {
  const store = createMemoryJsonStore({ [COURSES_FILE]: "{pas du json" });
  const repository = createCourseRepository(store);
  assert.deepEqual(await repository.list(), []);

  await store.write(COURSES_FILE, JSON.stringify([{ id: "x" }, makeCourse()]));
  assert.equal((await repository.list()).length, 1);
});

test("les résultats d'exercices sont enregistrés sans doublon", async () => {
  const store = createMemoryJsonStore();
  const repository = createProgressRepository(store);

  const result: ExerciseResult = {
    id: "result-1",
    courseId: "course-1",
    notionId: "n1",
    correct: true,
    answeredAt: "2026-11-24T10:00:00.000Z",
  };

  await repository.recordExercise(result);
  await repository.recordExercise({ ...result, correct: false });

  const reloaded = createProgressRepository(store);
  const results = await reloaded.listResults();
  assert.equal(results.length, 1);
  assert.equal(results[0].correct, false);
  assert.equal((await reloaded.listResults("course-1")).length, 1);
  assert.equal((await reloaded.listResults("autre")).length, 0);

  await store.write(PROGRESS_FILE, "corrompu");
  assert.deepEqual((await reloaded.load()).exerciseResults, []);

  await repository.recordExercise(result);
  await repository.clear();
  assert.deepEqual(await repository.listResults(), []);
});

test("le profil local a des valeurs sûres par défaut et persiste", async () => {
  const store = createMemoryJsonStore();
  const repository = createProfileRepository(store);

  const initial = await repository.load();
  assert.equal(initial.displayName, "Élève");
  assert.equal(initial.email, null);
  assert.equal(initial.privacy.aiProcessingConsent, true);
  assert.equal(initial.privacy.cloudBackup, false);

  const saved = await repository.save({
    ...defaultProfile(new Date("2026-11-21T10:00:00.000Z")),
    displayName: "  Awa  ",
    email: " awa@exemple.dev ",
    privacy: { aiProcessingConsent: false, cloudBackup: true },
  });
  assert.equal(saved.displayName, "Awa");
  assert.equal(saved.email, "awa@exemple.dev");

  const reloaded = await createProfileRepository(store).load();
  assert.equal(reloaded.displayName, "Awa");
  assert.equal(reloaded.privacy.aiProcessingConsent, false);
  assert.equal(reloaded.privacy.cloudBackup, true);

  await store.write(PROFILE_FILE, "corrompu");
  assert.equal((await repository.load()).displayName, "Élève");

  await repository.remove();
  assert.equal((await repository.load()).displayName, "Élève");
});
