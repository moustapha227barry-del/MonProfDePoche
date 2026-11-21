import { readJsonObject, type JsonStore } from "./jsonStore.ts";

/**
 * Profil local et préférences de confidentialité (`profile.json`).
 *
 * Tant que l'authentification n'est pas branchée, l'application fonctionne en
 * mode local : le profil ne quitte jamais le téléphone. Les deux options de
 * confidentialité sont explicites et décochées par défaut.
 */

export const PROFILE_FILE = "profile.json";

export type PrivacySettings = {
  /** Autorise l'envoi des fichiers au service IA (analyse et tuteur). */
  aiProcessingConsent: boolean;
  /** Autorise la future sauvegarde cloud (aucune n'est active aujourd'hui). */
  cloudBackup: boolean;
};

export type UserProfile = {
  displayName: string;
  email: string | null;
  createdAt: string;
  privacy: PrivacySettings;
};

export function defaultProfile(now: Date = new Date()): UserProfile {
  return {
    displayName: "Élève",
    email: null,
    createdAt: now.toISOString(),
    privacy: { aiProcessingConsent: true, cloudBackup: false },
  };
}

function parseProfile(value: unknown): UserProfile | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  const privacy =
    typeof candidate.privacy === "object" && candidate.privacy !== null
      ? (candidate.privacy as Record<string, unknown>)
      : {};
  const email = typeof candidate.email === "string" && candidate.email.trim() ? candidate.email.trim() : null;
  return {
    displayName:
      typeof candidate.displayName === "string" && candidate.displayName.trim()
        ? candidate.displayName.trim().slice(0, 60)
        : "Élève",
    email,
    createdAt:
      typeof candidate.createdAt === "string" ? candidate.createdAt : new Date(0).toISOString(),
    privacy: {
      aiProcessingConsent: privacy.aiProcessingConsent !== false,
      cloudBackup: privacy.cloudBackup === true,
    },
  };
}

export function createProfileRepository(store: JsonStore) {
  return {
    async load(): Promise<UserProfile> {
      const profile = readJsonObject(await store.read(PROFILE_FILE), parseProfile, defaultProfile());
      return profile;
    },

    async save(profile: UserProfile): Promise<UserProfile> {
      const clean: UserProfile = {
        ...profile,
        displayName: profile.displayName.trim().slice(0, 60) || "Élève",
        email: profile.email?.trim() ? profile.email.trim() : null,
      };
      await store.write(PROFILE_FILE, JSON.stringify(clean, null, 2));
      return clean;
    },

    async remove(): Promise<void> {
      await store.remove(PROFILE_FILE);
    },
  };
}

export type ProfileRepository = ReturnType<typeof createProfileRepository>;
