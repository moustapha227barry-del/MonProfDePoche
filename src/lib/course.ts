import type { Chapter, Course, Notion, Section } from "@/domain/course";
import type { SubjectId } from "@/lib/subjects";

import { isSubjectId } from "./subjects.ts";

/**
 * Helpers purs des cours : recherche, statistiques, modifications locales et
 * validation du stockage. Aucune dépendance Expo : testé sous Node.
 */

export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function chapterText(chapter: Chapter): string {
  const sections = chapter.sections.map((section) => `${section.title} ${section.content}`);
  const notions = chapter.notions.map(
    (notion) =>
      `${notion.title} ${notion.definition ?? ""} ${notion.formula ?? ""} ${notion.method ?? ""} ${notion.example ?? ""}`,
  );
  return [chapter.title, chapter.summary, ...sections, ...notions].join(" ");
}

/** Concatène tout le texte d'un cours (titre compris), pour la recherche. */
export function courseText(course: Course): string {
  return [course.title, course.subject, ...course.chapters.map(chapterText)].join(" ");
}

/** Vrai si `query` apparaît dans le cours, accents et majuscules ignorés. */
export function courseMatches(course: Course, query: string): boolean {
  const normalized = normalizeForSearch(query);
  if (!normalized) return true;
  return normalizeForSearch(courseText(course)).includes(normalized);
}

/** Recherche dans les cours, avec filtre de matière facultatif. */
export function searchCourses(
  courses: readonly Course[],
  query: string,
  subject: SubjectId | "all" = "all",
): Course[] {
  return courses.filter(
    (course) =>
      (subject === "all" || course.subject === subject) && courseMatches(course, query),
  );
}

export type CourseStats = {
  chapters: number;
  sections: number;
  notions: number;
  studiedChapters: number;
  masteryPercent: number;
};

export function chapterMastery(chapter: Chapter): number {
  if (chapter.notions.length === 0) return chapter.studiedAt ? 60 : 0;
  const total = chapter.notions.reduce(
    (sum, notion) =>
      sum + Math.min(100, Math.max(0, Number.isFinite(notion.masteryPercent) ? notion.masteryPercent : 0)),
    0,
  );
  return Math.round(total / chapter.notions.length);
}

export function courseStats(course: Course): CourseStats {
  const chapters = course.chapters.length;
  const sections = course.chapters.reduce((sum, chapter) => sum + chapter.sections.length, 0);
  const notions = course.chapters.reduce((sum, chapter) => sum + chapter.notions.length, 0);
  const studiedChapters = course.chapters.filter((chapter) => Boolean(chapter.studiedAt)).length;
  const mastery =
    chapters === 0
      ? 0
      : Math.round(
          course.chapters.reduce((sum, chapter) => sum + chapterMastery(chapter), 0) / chapters,
        );
  return { chapters, sections, notions, studiedChapters, masteryPercent: mastery };
}

/** Notions dont la maîtrise est inférieure au seuil, pour l'onglet Progrès. */
export function notionsToReview(
  courses: readonly Course[],
  threshold = 50,
): { courseId: string; courseTitle: string; subject: SubjectId; notion: Notion }[] {
  const result: { courseId: string; courseTitle: string; subject: SubjectId; notion: Notion }[] = [];
  for (const course of courses) {
    for (const chapter of course.chapters) {
      for (const notion of chapter.notions) {
        if (notion.masteryPercent < threshold) {
          result.push({
            courseId: course.id,
            courseTitle: course.title,
            subject: course.subject,
            notion,
          });
        }
      }
    }
  }
  return result.sort((a, b) => a.notion.masteryPercent - b.notion.masteryPercent);
}

/** Tri d'affichage : dernier cours modifié en premier. */
export function sortCourses(courses: readonly Course[]): Course[] {
  return [...courses].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Renomme un cours sans le muter ; un titre vide est ignoré. */
export function renameCourse(course: Course, title: string, now: Date = new Date()): Course {
  const clean = title.trim().slice(0, 120);
  if (!clean) return course;
  return { ...course, title: clean, updatedAt: now.toISOString() };
}

/** Marque un chapitre comme étudié (idempotent). */
export function markChapterStudied(
  course: Course,
  chapterId: string,
  at: Date = new Date(),
): Course {
  const stamp = at.toISOString();
  return {
    ...course,
    updatedAt: stamp,
    chapters: course.chapters.map((chapter) =>
      chapter.id === chapterId && !chapter.studiedAt
        ? { ...chapter, studiedAt: stamp }
        : chapter,
    ),
  };
}

/** Fixe la maîtrise d'une notion (0 à 100). */
export function setNotionMastery(course: Course, notionId: string, percent: number): Course {
  const value = Math.round(Math.min(100, Math.max(0, Number.isFinite(percent) ? percent : 0)));
  let changed = false;
  const chapters = course.chapters.map((chapter) => ({
    ...chapter,
    notions: chapter.notions.map((notion) => {
      if (notion.id !== notionId) return notion;
      changed = true;
      return { ...notion, masteryPercent: value };
    }),
  }));
  if (!changed) return course;
  return { ...course, chapters, updatedAt: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Validation du stockage
// ---------------------------------------------------------------------------

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function parseSection(value: unknown, fallbackId: string): Section | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  const title = asString(candidate.title);
  const content = asString(candidate.content);
  if (!title || !content) return null;
  return { id: asString(candidate.id) ?? fallbackId, title, content };
}

function parseNotion(value: unknown, fallbackId: string): Notion | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  const title = asString(candidate.title);
  if (!title) return null;
  const mastery =
    typeof candidate.masteryPercent === "number" && Number.isFinite(candidate.masteryPercent)
      ? Math.min(100, Math.max(0, Math.round(candidate.masteryPercent)))
      : 0;
  return {
    id: asString(candidate.id) ?? fallbackId,
    title,
    definition: asString(candidate.definition),
    formula: asString(candidate.formula),
    method: asString(candidate.method),
    example: asString(candidate.example),
    masteryPercent: mastery,
    uncertain: candidate.uncertain === true ? true : undefined,
  };
}

function parseChapter(value: unknown, index: number): Chapter | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  const title = asString(candidate.title);
  if (!title) return null;
  const chapterId = asString(candidate.id) ?? `chapter-${index + 1}`;
  const sections = Array.isArray(candidate.sections)
    ? candidate.sections
        .map((section, sectionIndex) => parseSection(section, `${chapterId}-section-${sectionIndex + 1}`))
        .filter((section): section is Section => section !== null)
    : [];
  const notions = Array.isArray(candidate.notions)
    ? candidate.notions
        .map((notion, notionIndex) => parseNotion(notion, `${chapterId}-notion-${notionIndex + 1}`))
        .filter((notion): notion is Notion => notion !== null)
    : [];
  return {
    id: chapterId,
    title,
    summary: asString(candidate.summary) ?? "",
    sections,
    notions,
    studiedAt: asString(candidate.studiedAt),
  };
}

/** Valide un cours relu du stockage ; renvoie null si l'essentiel manque. */
export function parseStoredCourse(value: unknown): Course | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  const id = asString(candidate.id);
  const title = asString(candidate.title);
  if (!id || !title) return null;
  if (!isSubjectId(candidate.subject)) return null;
  if (!Array.isArray(candidate.chapters) || candidate.chapters.length === 0) return null;

  const chapters = candidate.chapters
    .map((chapter, index) => parseChapter(chapter, index))
    .filter((chapter): chapter is Chapter => chapter !== null);
  if (chapters.length === 0) return null;

  const createdAt = asString(candidate.createdAt) ?? new Date(0).toISOString();
  return {
    id,
    title,
    subject: candidate.subject,
    chapters,
    createdAt,
    updatedAt: asString(candidate.updatedAt) ?? createdAt,
    status: candidate.status === "done" || candidate.status === "failed" ? candidate.status : "done",
    recordingIds: Array.isArray(candidate.recordingIds)
      ? candidate.recordingIds.filter((item): item is string => typeof item === "string")
      : [],
    uncertainties: Array.isArray(candidate.uncertainties)
      ? candidate.uncertainties.filter((item): item is string => typeof item === "string")
      : [],
  };
}
