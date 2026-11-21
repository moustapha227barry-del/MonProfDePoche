import type { Course } from "@/domain/course";

import {
  markChapterStudied,
  parseStoredCourse,
  renameCourse,
  setNotionMastery,
  sortCourses,
} from "../../lib/course.ts";
import { readJsonArray, type JsonStore } from "./jsonStore.ts";

/**
 * Stockage local des cours analysés (`courses.json`).
 *
 * Un cours n'est écrit qu'après une analyse réussie : aucune donnée de
 * démonstration n'est créée ici. Les fichiers audio restent dans le dossier
 * documents ; le cours conserve leurs identifiants (`recordingIds`).
 */

export const COURSES_FILE = "courses.json";

export function createCourseRepository(store: JsonStore) {
  async function readAll(): Promise<Course[]> {
    return readJsonArray(await store.read(COURSES_FILE), parseStoredCourse);
  }

  async function writeAll(courses: readonly Course[]): Promise<void> {
    await store.write(COURSES_FILE, JSON.stringify(courses, null, 2));
  }

  return {
    /** Cours du plus récemment modifié au plus ancien. */
    async list(): Promise<Course[]> {
      return sortCourses(await readAll());
    },

    async get(id: string): Promise<Course | null> {
      return (await readAll()).find((course) => course.id === id) ?? null;
    },

    /** Enregistre ou remplace un cours (clé : `id`). */
    async save(course: Course): Promise<void> {
      const courses = await readAll();
      const others = courses.filter((item) => item.id !== course.id);
      await writeAll(sortCourses([course, ...others]));
    },

    async rename(id: string, title: string): Promise<Course | null> {
      if (!title.trim()) return null;
      const courses = await readAll();
      const target = courses.find((course) => course.id === id);
      if (!target) return null;
      const updated = renameCourse(target, title);
      await writeAll(courses.map((course) => (course.id === id ? updated : course)));
      return updated;
    },

    async remove(id: string): Promise<void> {
      const courses = await readAll();
      await writeAll(courses.filter((course) => course.id !== id));
    },

    async markChapterStudied(id: string, chapterId: string): Promise<Course | null> {
      const courses = await readAll();
      const target = courses.find((course) => course.id === id);
      if (!target) return null;
      const updated = markChapterStudied(target, chapterId);
      await writeAll(courses.map((course) => (course.id === id ? updated : course)));
      return updated;
    },

    async setNotionMastery(
      id: string,
      notionId: string,
      masteryPercent: number,
    ): Promise<Course | null> {
      const courses = await readAll();
      const target = courses.find((course) => course.id === id);
      if (!target) return null;
      const updated = setNotionMastery(target, notionId, masteryPercent);
      await writeAll(courses.map((course) => (course.id === id ? updated : course)));
      return updated;
    },
  };
}

export type CourseRepository = ReturnType<typeof createCourseRepository>;
