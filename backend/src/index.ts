import {
  ANALYSIS_SYSTEM_PROMPT,
  ANALYSIS_TRANSCRIPTION_PROMPT,
  TUTOR_SYSTEM_PROMPT,
  buildAnalysisPrompt,
  buildTutorPrompt,
} from "./prompts";
import {
  allowRequest,
  extractJson,
  mapUpstreamStatus,
  normalizeAnalysis,
  normalizeTutor,
  validateUploads,
} from "./validate";

/**
 * Backend sécurisé de Mon Prof de Poche (Cloudflare Worker).
 *
 * La clé du fournisseur IA vit ici, dans un secret de déploiement
 * (`wrangler secret put AI_API_KEY`). Elle n'est jamais transmise au client ni
 * écrite dans le dépôt.
 *
 * Endpoints :
 * - GET  /health   → état de configuration (aucun secret)
 * - POST /analysis → audio (1 à 5 fichiers) → transcription + cours structuré
 * - POST /tutor    → question + contexte de cours → réponse citée
 */

export interface Env {
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
  AI_TRANSCRIPTION_MODEL?: string;
  AI_CHAT_MODEL?: string;
  ALLOWED_ORIGIN?: string;
}

const MAX_REQUEST_BYTES = 90 * 1024 * 1024;
const requestLog = new Map<string, number[]>();

class UpstreamError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = "UpstreamError";
    this.status = status;
    this.code = code;
  }
}

function corsHeaders(env: Env): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN ?? "*",
    "Access-Control-Allow-Headers": "Content-Type, Accept, X-Client-Language",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

function json(body: unknown, status: number, env: Env): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(env),
    },
  });
}

function apiBase(env: Env): string {
  return (env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "");
}

function ensureUpstream(response: Response): void {
  if (response.ok) return;
  const mapped = mapUpstreamStatus(response.status);
  throw new UpstreamError(mapped.status, mapped.code);
}

async function transcribe(env: Env, file: File, fileName: string): Promise<string> {
  const form = new FormData();
  form.append("file", file, fileName);
  form.append("model", env.AI_TRANSCRIPTION_MODEL ?? "whisper-1");
  form.append("language", "fr");
  form.append("prompt", ANALYSIS_TRANSCRIPTION_PROMPT);

  const response = await fetch(`${apiBase(env)}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.AI_API_KEY ?? ""}` },
    body: form,
  });
  ensureUpstream(response);

  const data = (await response.json()) as { text?: unknown };
  return typeof data.text === "string" ? data.text.trim() : "";
}

async function chatJson(env: Env, system: string, user: string): Promise<unknown> {
  const response = await fetch(`${apiBase(env)}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.AI_API_KEY ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.AI_CHAT_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  ensureUpstream(response);

  const data = (await response.json()) as {
    choices?: { message?: { content?: unknown } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  return typeof content === "string" ? extractJson(content) : null;
}

async function handleAnalysis(request: Request, env: Env): Promise<Response> {
  const form = await request.formData();

  let payload: {
    language?: string;
    batch?: { id?: string; files?: { fileName?: string; subject?: string; durationMs?: number }[] };
  };
  const rawPayload = form.get("payload");
  try {
    payload = typeof rawPayload === "string" ? JSON.parse(rawPayload) : {};
  } catch {
    return json({ error: "invalid-payload", message: "Métadonnées illisibles." }, 400, env);
  }

  if (!payload.batch?.id) {
    return json({ error: "invalid-payload", message: "Lot d'analyse manquant." }, 400, env);
  }

  const files = form.getAll("audio").filter((entry): entry is File => typeof entry !== "string");
  const check = validateUploads(files.map((file) => ({ name: file.name, size: file.size })));
  if (!check.ok) {
    const status = check.code === "file-too-large" || check.code === "payload-too-large" ? 413 : 400;
    return json({ error: check.code, message: check.message }, status, env);
  }

  const metaFiles = payload.batch.files ?? [];
  if (files.length !== metaFiles.length) {
    return json(
      {
        error: "file-count-mismatch",
        message: "Le nombre de fichiers reçus ne correspond pas au lot.",
      },
      400,
      env,
    );
  }

  const parts: string[] = [];
  for (const [index, file] of files.entries()) {
    const meta = metaFiles[index] ?? {};
    const text = await transcribe(env, file, meta.fileName ?? file.name);
    parts.push(
      text.length > 0
        ? `--- ${meta.fileName ?? file.name} ---\n${text}`
        : `--- ${meta.fileName ?? file.name} ---\n[Passage inaudible : aucune transcription exploitable.]`,
    );
  }
  const transcript = parts.join("\n\n").slice(0, 200_000);

  const promptFiles = metaFiles.map((file) => ({
    fileName: file.fileName ?? "audio.m4a",
    subject: file.subject ?? "other",
    durationMs: typeof file.durationMs === "number" ? file.durationMs : 0,
  }));

  const result = await chatJson(
    env,
    ANALYSIS_SYSTEM_PROMPT,
    `${buildAnalysisPrompt(promptFiles, payload.language ?? "fr")}\n\nTranscription :\n${transcript}`,
  );
  const normalized = normalizeAnalysis(result);
  if (!normalized) {
    return json(
      { error: "invalid-model-output", message: "Le modèle n'a pas produit de cours exploitable." },
      502,
      env,
    );
  }

  return json(
    {
      course: normalized.course,
      uncertainties: normalized.uncertainties,
      transcript: normalized.transcript ?? transcript,
    },
    200,
    env,
  );
}

async function handleTutor(request: Request, env: Env): Promise<Response> {
  let body: {
    question?: unknown;
    level?: unknown;
    course?: { context?: unknown };
    history?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "invalid-payload", message: "Requête illisible." }, 400, env);
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  const context = typeof body.course?.context === "string" ? body.course.context : "";
  if (!question || !context) {
    return json(
      { error: "invalid-payload", message: "Question et contexte de cours requis." },
      400,
      env,
    );
  }
  if (question.length > 1000 || context.length > 12_000) {
    return json({ error: "payload-too-large", message: "Question ou cours trop long." }, 413, env);
  }

  const result = await chatJson(
    env,
    TUTOR_SYSTEM_PROMPT,
    buildTutorPrompt({
      question,
      level: typeof body.level === "string" ? body.level : "lycee",
      courseContext: context,
    }),
  );
  const normalized = normalizeTutor(result);
  if (!normalized) {
    return json({ error: "invalid-model-output", message: "Réponse inexploitable." }, 502, env);
  }

  return json(normalized, 200, env);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json(
        {
          ok: true,
          aiConfigured: Boolean(env.AI_API_KEY),
          models: {
            transcription: env.AI_TRANSCRIPTION_MODEL ?? "whisper-1",
            chat: env.AI_CHAT_MODEL ?? "gpt-4o-mini",
          },
        },
        200,
        env,
      );
    }

    const clientIp = request.headers.get("CF-Connecting-IP") ?? "local";
    const rate = allowRequest(requestLog.get(clientIp) ?? [], Date.now());
    requestLog.set(clientIp, rate.timestamps);
    if (!rate.allowed) {
      return json(
        { error: "rate-limit", message: "Trop de demandes. Réessaie dans une minute." },
        429,
        env,
      );
    }

    if (!env.AI_API_KEY) {
      return json(
        {
          error: "ai-not-configured",
          message: "La clé du fournisseur IA n'est pas configurée sur le backend.",
        },
        503,
        env,
      );
    }

    const declaredSize = Number(request.headers.get("Content-Length") ?? "0");
    if (declaredSize > MAX_REQUEST_BYTES) {
      return json({ error: "payload-too-large", message: "Requête trop volumineuse." }, 413, env);
    }

    try {
      if (url.pathname === "/analysis" && request.method === "POST") {
        return await handleAnalysis(request, env);
      }
      if (url.pathname === "/tutor" && request.method === "POST") {
        return await handleTutor(request, env);
      }
      return json({ error: "not-found" }, 404, env);
    } catch (error) {
      if (error instanceof UpstreamError) {
        return json({ error: error.code }, error.status, env);
      }
      console.error("[backend] erreur interne", error instanceof Error ? error.name : "inconnue");
      return json({ error: "internal" }, 500, env);
    }
  },
};
