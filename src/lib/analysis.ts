import type { Course, Notion, Section } from "@/domain/course";
import type { PreparedAnalysisBatch } from "@/lib/basket";

import { AiServiceError } from "./ai.ts";
import { isSubjectId } from "./subjects.ts";

/**
 * Analyse IA : construction de la requête et validation de la réponse.
 *
 * Le modèle ne décide de rien : il propose un JSON, et tout ce qui n'est pas
 * conforme est refusé ou nettoyé avant d'atteindre le stockage. Les passages
 * incertains sont conservés dans `uncertainties` et affichés à l'élève, jamais
 * remplacés par une invention.
 */

const MAX_CHAPTERS = 40;
const MAX_SECTIONS = 20;
const MAX_NOTIONS = 20;
const MAX_TRANSCRIPT_CHARS = 200_000;

export type AnalysisRequestPayload = {
  language: "fr";
  batch: {
    id: string;
    files: {
      recordingId: string;
      fileName: string;
      mimeType: string;
      subject: string;
      durationMs: number;
    }[];
  };
};

/** Métadonnées envoyées avec les fichiers audio (aucun contenu textuel inventé). */
export function buildAnalysisRequestPayload(
  batch: PreparedAnalysisBatch,
): AnalysisRequestPayload {
  return {
    language: "fr",
    batch: {
      id: batch.id,
      files: batch.files.map((file) => ({
        recordingId: file.recordingId,
        fileName: file.fileName,
        mimeType: file.mimeType,
        subject: file.subject,
        durationMs: file.durationMs,
      })),
    },
  };
}

function text(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  if (!clean) return undefined;
  return clean.length > maxLength ? clean.slice(0, maxLength) : clean;
}

function parseSection(value: unknown, id: string): Section | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  const title = text(candidate.title, 160);
  const content = text(candidate.content, 4000);
  if (!title || !content) return null;
  return { id, title, content };
}

function parseNotion(value: unknown, id: string): Notion | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  const title = text(candidate.title, 160);
  if (!title) return null;
  return {
    id,
    title,
    definition: text(candidate.definition, 1500),
    formula: text(candidate.formula, 800),
    method: text(candidate.method, 1500),
    example: text(candidate.example, 1500),
    // La maîtrise vient des exercices de l'élève, pas du modèle.
    masteryPercent: 0,
    uncertain: candidate.uncertain === true ? true : undefined,
  };
}

/**
 * Valide le JSON renvoyé par le backend et construit un `Course` complet.
 * Lève `AiServiceError("invalid-response")` si la structure n'est pas
 * exploitable : rien n'est alors enregistré.
 */
export function parseAnalysisResponse(
  raw: unknown,
  options: { batch: PreparedAnalysisBatch; now?: Date },
): { course: Course; transcript: string; uncertainties: string[] } {
  const now = options.now ?? new Date();
  if (typeof raw !== "object" || raw === null) {
    throw new AiServiceError("invalid-response");
  }

  const root = raw as Record<string, unknown>;
  const source = (typeof root.course === "object" && root.course !== null
    ? root.course
    : root) as Record<string, unknown>;

  const title = text(source.title, 160);
  if (!title) throw new AiServiceError("invalid-response");

  if (!Array.isArray(source.chapters) || source.chapters.length === 0) {
    throw new AiServiceError("invalid-response");
  }

  const chapters = source.chapters.slice(0, MAX_CHAPTERS).map((value, index) => {
    const chapterId = `chapter-${index + 1}`;
    const candidate = (typeof value === "object" && value !== null
      ? value
      : {}) as Record<string, unknown>;
    const chapterTitle = text(candidate.title, 160) ?? `Chapitre ${index + 1}`;
    const sections = Array.isArray(candidate.sections)
      ? candidate.sections
          .slice(0, MAX_SECTIONS)
          .map((section, sectionIndex) =>
            parseSection(section, `${chapterId}-section-${sectionIndex + 1}`),
          )
          .filter((section): section is Section => section !== null)
      : [];
    const notions = Array.isArray(candidate.notions)
      ? candidate.notions
          .slice(0, MAX_NOTIONS)
          .map((notion, notionIndex) =>
            parseNotion(notion, `${chapterId}-notion-${notionIndex + 1}`),
          )
          .filter((notion): notion is Notion => notion !== null)
      : [];

    return {
      id: chapterId,
      title: chapterTitle,
      summary: text(candidate.summary, 800) ?? "",
      sections,
      notions,
    };
  });

  const usable = chapters.filter(
    (chapter) => chapter.sections.length > 0 || chapter.notions.length > 0,
  );
  if (usable.length === 0) throw new AiServiceError("invalid-response");

  const uncertainties = Array.isArray(root.uncertainties)
    ? root.uncertainties
        .map((item) => text(item, 500))
        .filter((item): item is string => Boolean(item))
        .slice(0, 40)
    : [];

  const subject = isSubjectId(source.subject)
    ? source.subject
    : options.batch.files[0]?.subject ?? "other";

  const transcript = text(root.transcript, MAX_TRANSCRIPT_CHARS) ?? "";
  const stamp = now.toISOString();

  return {
    transcript,
    uncertainties,
    course: {
      id: `course-${options.batch.id}`,
      title,
      subject,
      chapters: usable,
      createdAt: stamp,
      updatedAt: stamp,
      status: "done",
      recordingIds: options.batch.files.map((file) => file.recordingId),
      uncertainties,
      transcript,
    },
  };
}
