import type { Course } from "../src/domain/course.ts";

/** Cours de test complet : deux chapitres, deux notions, une section. */
export function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: "course-1",
    title: "Fonctions dérivées",
    subject: "mathematics",
    chapters: [
      {
        id: "chapter-1",
        title: "Limites",
        summary: "Notion de limite",
        sections: [
          { id: "s1", title: "Approche", content: "On étudie la limite en un point." },
        ],
        notions: [
          { id: "n1", title: "Dérivée", definition: "Taux de variation", masteryPercent: 40 },
          {
            id: "n2",
            title: "Tangente",
            formula: "y = f'(a)(x-a)+f(a)",
            masteryPercent: 90,
          },
        ],
      },
      {
        id: "chapter-2",
        title: "Continuité",
        summary: "",
        sections: [],
        notions: [],
        studiedAt: "2026-11-20T10:00:00.000Z",
      },
    ],
    createdAt: "2026-11-20T10:00:00.000Z",
    updatedAt: "2026-11-21T10:00:00.000Z",
    status: "done",
    recordingIds: ["rec-1"],
    uncertainties: [],
    ...overrides,
  };
}
