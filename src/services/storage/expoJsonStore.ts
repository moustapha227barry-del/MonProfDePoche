import { File, Paths } from "expo-file-system";

import type { JsonStore } from "./jsonStore.ts";

/**
 * Stockage JSON réel : un fichier par base, dans le dossier **documents** de
 * l'application. Ce dossier n'est pas vidé par Android, contrairement au cache,
 * et reste accessible hors ligne.
 */

function fileFor(name: string): File {
  return new File(Paths.document, name);
}

export const expoJsonStore: JsonStore = {
  async read(name) {
    const file = fileFor(name);
    if (!file.exists) return null;
    return file.text();
  },

  async write(name, contents) {
    const file = fileFor(name);
    if (!file.exists) file.create();
    await file.write(contents);
  },

  async remove(name) {
    const file = fileFor(name);
    if (file.exists) file.delete();
  },
};
