import type { Course } from "@/domain/course";
import type { SubjectId } from "@/lib/subjects";

import { AiServiceError } from "./ai.ts";
import { normalizeForSearch } from "./course.ts";

/**
 * Tuteur IA : contexte construit à partir du cours de l'élève et validation
 * des réponses. Une citation qui ne correspond à aucun chapitre ou notion du
 * cours est supprimée : le tuteur ne peut pas prétendre citer un contenu
 * inexistant.
 */

export type TutorLevel = "college" | "lycee" | "superieur";

export type TutorTurn = { role: "student" | "tutor"; content: string };

export type TutorRequestPayload = {
  question: string;
  level: TutorLevel;
  course: {
    id: string;
    title: string;
    subject: SubjectId;
    context: string;
  };
  history: TutorTurn[];
};

const MAX_CONTEXT_CHARS = 6000;
const MAX_QUESTION_CHARS = 1000;
const MAX_HISTORY_TURNS = 12;

/** Texte de cours transmis au tuteur : titres, résumés, sections et notions. */
export function buildTutorContext(course: Course, maxChars = MAX_CONTEXT_CHARS): string {
  const blocks: string[] = [`Cours : ${course.title} (${course.subject})`];
  for (const chapter of course.chapters) {
    blocks.push(`Chapitre : ${chapter.title}`);
    if (chapter.summary) blocks.push(`Résumé : ${chapter.summary}`);
    for (const section of chapter.sections) {
      blocks.push(`Section « ${section.title} » : ${section.content}`);
    }
    for (const notion of chapter.notions) {
      const details = [
        notion.definition ? `Définition : ${notion.definition}` : "",
        notion.formula ? `Formule : ${notion.formula}` : "",
        notion.method ? `Méthode : ${notion.method}` : "",
        notion.example ? `Exemple : ${notion.example}` : "",
      ].filter(Boolean);
      blocks.push(`Notion « ${notion.title} ». ${details.join(" ")}`);
    }
  }
  const text = blocks.join("\n");
  return text.length > maxChars ? `${text.slice(0, maxChars)}…` : text;
}

export function buildTutorPayload(input: {
  question: string;
  course: Course;
  history?: readonly TutorTurn[];
  level?: TutorLevel;
}): TutorRequestPayload {
  const question = input.question.trim().slice(0, MAX_QUESTION_CHARS);
  if (!question) throw new AiServiceError("invalid-response", "Écris une question avant d’envoyer.");
  return {
    question,
    level: input.level ?? "lycee",
    course: {
      id: input.course.id,
      title: input.course.title,
      subject: input.course.subject,
      context: buildTutorContext(input.course),
    },
    history: (input.history ?? []).slice(-MAX_HISTORY_TURNS),
  };
}

function cleanText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  if (!clean) return undefined;
  return clean.length > maxLength ? clean.slice(0, maxLength) : clean;
}

/** Titres connus du cours, pour vérifier les citations. */
export function courseCitationTitles(course: Course): string[] {
  const titles = new Set<string>();
  for (const chapter of course.chapters) {
    titles.add(normalizeForSearch(chapter.title));
    for (const section of chapter.sections) titles.add(normalizeForSearch(section.title));
    for (const notion of chapter.notions) titles.add(normalizeForSearch(notion.title));
  }
  return [...titles];
}

export type ParsedTutorReply = {
  answer: string;
  hint?: string;
  citations: string[];
  /** Faux quand la réponse ne s'appuie sur aucun passage du cours. */
  grounded: boolean;
};

/**
 * Valide la réponse du backend. Lève `invalid-response` si la réponse est
 * vide ; sinon retire les citations inconnues et signale l'absence d'appui.
 */
export function parseTutorResponse(raw: unknown, course: Course): ParsedTutorReply {
  if (typeof raw !== "object" || raw === null) throw new AiServiceError("invalid-response");
  const candidate = raw as Record<string, unknown>;
  const answer = cleanText(candidate.answer, 6000);
  if (!answer) throw new AiServiceError("invalid-response");

  const known = new Set(courseCitationTitles(course));
  const rawCitations = Array.isArray(candidate.citations) ? candidate.citations : [];
  const citations = rawCitations
    .map((citation) => cleanText(citation, 160))
    .filter((citation): citation is string => Boolean(citation))
    .filter((citation) => known.has(normalizeForSearch(citation)));

  const claimedGrounded = candidate.grounded !== false;
  return {
    answer,
    hint: cleanText(candidate.hint, 500),
    citations,
    grounded: claimedGrounded && citations.length > 0,
  };
}
