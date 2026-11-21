import assert from "node:assert/strict";
import test from "node:test";

import {
  AiServiceError,
  backendBaseUrl,
  describeAiError,
  isRetryable,
  mapHttpError,
  normalizeBaseUrl,
  toAiServiceError,
} from "../src/lib/ai.ts";

test("l'URL du backend est normalisée et validée", () => {
  assert.equal(normalizeBaseUrl("https://api.exemple.dev/"), "https://api.exemple.dev");
  assert.equal(normalizeBaseUrl("  http://10.0.0.5:8787//  "), "http://10.0.0.5:8787");
  assert.equal(normalizeBaseUrl("api.exemple.dev"), null);
  assert.equal(normalizeBaseUrl(""), null);
  assert.equal(normalizeBaseUrl(undefined), null);
  assert.equal(normalizeBaseUrl("javascript:alert(1)"), null);
});

test("l'URL publique est lue dans EXPO_PUBLIC_API_URL", () => {
  const previous = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = " https://backend.exemple.dev/ ";
  assert.equal(backendBaseUrl(), "https://backend.exemple.dev");

  process.env.EXPO_PUBLIC_API_URL = "";
  assert.equal(backendBaseUrl(), null);

  if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = previous;
});

test("les statuts HTTP deviennent des erreurs explicites", () => {
  assert.equal(mapHttpError(401).code, "unauthorized");
  assert.equal(mapHttpError(403).code, "unauthorized");
  assert.equal(mapHttpError(413).code, "payload-too-large");
  assert.equal(mapHttpError(429).code, "rate-limit");
  assert.equal(mapHttpError(504).code, "timeout");
  assert.equal(mapHttpError(400).code, "invalid-response");
  assert.equal(mapHttpError(500).code, "server");
  assert.equal(mapHttpError(503).status, 503);
});

test("les erreurs réseau et les annulations sont typées", () => {
  const abort = new Error("aborted");
  abort.name = "AbortError";
  assert.equal(toAiServiceError(abort).code, "timeout");
  assert.equal(toAiServiceError(new Error("boom")).code, "network");

  const known = new AiServiceError("rate-limit");
  assert.equal(toAiServiceError(known), known, "une erreur IA n'est pas réemballée");

  assert.equal(isRetryable(new AiServiceError("network")), true);
  assert.equal(isRetryable(new AiServiceError("server")), true);
  assert.equal(isRetryable(new AiServiceError("missing-backend")), false);
  assert.equal(isRetryable(new Error("x")), false);
});

test("les messages utilisateur sont en français et actionnables", () => {
  assert.match(describeAiError(new AiServiceError("missing-backend")), /EXPO_PUBLIC_API_URL/);
  assert.match(describeAiError(new AiServiceError("rate-limit")), /Patiente/);
  assert.match(describeAiError(new Error("inconnu")), /connexion Internet/);
});
