/**
 * Validation des entrées et sorties du backend.
 *
 * Pur, sans dépendance Cloudflare : testé par `node --test` dans
 * `tests/backend.test.ts`. Le worker ne fait que brancher ces fonctions sur
 * `fetch` et sur les variables d'environnement.
 */

export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 Mo par fichier
export const MAX_TOTAL_BYTES = 80 * 1024 * 1024; // 80 Mo par requête
export const RATE_LIMIT_PER_MINUTE = 8;

export type UploadFile = { name: string; size: number };

/** Vérifie le nombre et la taille des fichiers reçus. */
export function validateUploads(files: readonly UploadFile[]): { ok: true } | { ok: false; code: string; message: string } {
  if (files.length === 0) {
    return { ok: false, code: "no-files", message: "Aucun fichier audio reçu." };
  }
  if (files.length > MAX_FILES) {
    return {
      ok: false,
      code: "too-many-files",
      message: `${MAX_FILES} fichiers maximum par analyse.`,
    };
  }
  const tooBig = files.find((file) => file.size > MAX_FILE_BYTES);
  if (tooBig) {
    return {
      ok: false,
      code: "file-too-large",
      message: `« ${tooBig.name} » dépasse 25 Mo.`,
    };
  }
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_TOTAL_BYTES) {
    return { ok: false, code: "payload-too-large", message: "Lot trop volumineux (80 Mo maximum)." };
  }
  return { ok: true };
}

/** Extrait le premier objet JSON d'une réponse de modèle, même entourée de texte. */
export function extractJson(raw: string): unknown | null {
  const text = raw.trim();
  if (!text) return null;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : text;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function str(value: unknown, max = 4000): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  if (!clean) return undefined;
  return clean.length > max ? clean.slice(0, max) : clean;
}

export type NormalizedAnalysis = {
  course: {
    title: string;
    subject?: string;
    chapters: {
      title: string;
      summary: string;
      sections: { title: string; content: string }[];
      notions: {
        title: string;
        definition?: string;
        formula?: string;
        method?: string;
        example?: string;
        uncertain?: boolean;
      }[];
    }[];
  };
  uncertainties: string[];
  transcript?: string;
};

/** Normalise la sortie du modèle d'analyse ; null si inexploitable. */
export function normalizeAnalysis(value: unknown): NormalizedAnalysis | null {
  if (typeof value !== "object" || value === null) return null;
  const root = value as Record<string, unknown>;
  const course = (typeof root.course === "object" && root.course !== null
    ? root.course
    : root) as Record<string, unknown>;

  const title = str(course.title, 160);
  if (!title || !Array.isArray(course.chapters)) return null;

  const chapters = course.chapters
    .slice(0, 40)
    .map((chapter) => {
      const item = (typeof chapter === "object" && chapter !== null
        ? chapter
        : {}) as Record<string, unknown>;
      const chapterTitle = str(item.title, 160);
      if (!chapterTitle) return null;
      const sections = Array.isArray(item.sections)
        ? item.sections
            .map((section) => {
              const entry = (typeof section === "object" && section !== null
                ? section
                : {}) as Record<string, unknown>;
              const sectionTitle = str(entry.title, 160);
              const content = str(entry.content, 4000);
              return sectionTitle && content ? { title: sectionTitle, content } : null;
            })
            .filter((section): section is { title: string; content: string } => section !== null)
        : [];
      const notions = Array.isArray(item.notions)
        ? item.notions
            .map((notion) => {
              const entry = (typeof notion === "object" && notion !== null
                ? notion
                : {}) as Record<string, unknown>;
              const notionTitle = str(entry.title, 160);
              if (!notionTitle) return null;
              return {
                title: notionTitle,
                definition: str(entry.definition, 1500),
                formula: str(entry.formula, 800),
                method: str(entry.method, 1500),
                example: str(entry.example, 1500),
                uncertain: entry.uncertain === true ? true : undefined,
              };
            })
            .filter((notion): notion is NonNullable<typeof notion> => notion !== null)
        : [];
      if (sections.length === 0 && notions.length === 0) return null;
      return { title: chapterTitle, summary: str(item.summary, 800) ?? "", sections, notions };
    })
    .filter((chapter): chapter is NonNullable<typeof chapter> => chapter !== null);

  if (chapters.length === 0) return null;

  const uncertainties = Array.isArray(root.uncertainties)
    ? root.uncertainties
        .map((item) => str(item, 500))
        .filter((item): item is string => Boolean(item))
        .slice(0, 40)
    : [];

  return {
    course: { title, subject: str(course.subject, 40), chapters },
    uncertainties,
    transcript: str(root.transcript, 200_000),
  };
}

export type NormalizedTutor = {
  answer: string;
  hint?: string;
  citations: string[];
  grounded: boolean;
};

/** Normalise la sortie du tuteur ; null si la réponse est vide. */
export function normalizeTutor(value: unknown): NormalizedTutor | null {
  if (typeof value !== "object" || value === null) return null;
  const root = value as Record<string, unknown>;
  const answer = str(root.answer, 6000);
  if (!answer) return null;
  const citations = Array.isArray(root.citations)
    ? root.citations
        .map((item) => str(item, 160))
        .filter((item): item is string => Boolean(item))
        .slice(0, 20)
    : [];
  return {
    answer,
    hint: str(root.hint, 500),
    citations,
    grounded: root.grounded !== false && citations.length > 0,
  };
}

/** Traduit un statut du fournisseur en code public, sans fuite de détail. */
export function mapUpstreamStatus(status: number): { status: number; code: string } {
  if (status === 429) return { status: 429, code: "provider-rate-limit" };
  if (status === 401 || status === 403) return { status: 502, code: "provider-auth" };
  if (status === 413) return { status: 413, code: "payload-too-large" };
  if (status >= 400 && status < 500) return { status: 400, code: "provider-rejected" };
  return { status: 502, code: "provider-error" };
}

/** Découpe une fenêtre glissante pour le limiteur de débit en mémoire. */
export function allowRequest(
  timestamps: readonly number[],
  now: number,
  limit = RATE_LIMIT_PER_MINUTE,
  windowMs = 60_000,
): { allowed: boolean; timestamps: number[] } {
  const recent = timestamps.filter((stamp) => now - stamp < windowMs);
  if (recent.length >= limit) return { allowed: false, timestamps: recent };
  return { allowed: true, timestamps: [...recent, now] };
}
