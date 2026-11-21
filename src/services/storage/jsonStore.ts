/**
 * Abstraction minimale de stockage de fichiers JSON.
 *
 * Les repositories dépendent de cette interface, pas d'Expo : les tests
 * d'intégration les exécutent sur un stockage mémoire (`createMemoryJsonStore`)
 * tandis que l'application utilise `expoJsonStore` (dossier documents).
 */

export type JsonStore = {
  read(name: string): Promise<string | null>;
  write(name: string, contents: string): Promise<void>;
  remove(name: string): Promise<void>;
};

export type MemoryJsonStore = JsonStore & {
  snapshot(): Record<string, string>;
};

/** Stockage en mémoire, pour les tests et les aperçus sans système de fichiers. */
export function createMemoryJsonStore(initial: Record<string, string> = {}): MemoryJsonStore {
  const files = new Map(Object.entries(initial));
  return {
    async read(name) {
      return files.get(name) ?? null;
    },
    async write(name, contents) {
      files.set(name, contents);
    },
    async remove(name) {
      files.delete(name);
    },
    snapshot() {
      return Object.fromEntries(files);
    },
  };
}

/**
 * Lit un tableau JSON en ignorant les entrées invalides.
 * Un fichier absent ou corrompu renvoie une liste vide.
 */
export function readJsonArray<T>(
  raw: string | null,
  parseItem: (value: unknown) => T | null,
): T[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => parseItem(item))
      .filter((item): item is T => item !== null);
  } catch {
    return [];
  }
}

/** Lit un objet JSON ; renvoie `fallback` si le contenu est absent ou invalide. */
export function readJsonObject<T>(
  raw: string | null,
  parse: (value: unknown) => T | null,
  fallback: T,
): T {
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parse(parsed) ?? fallback;
  } catch {
    return fallback;
  }
}
