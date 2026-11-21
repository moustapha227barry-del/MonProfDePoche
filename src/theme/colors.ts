/**
 * Palette « Mon Prof de Poche » : nuit profonde, violets lumineux, bleus
 * électriques et verts de progression.
 *
 * Ces valeurs sont reprises à l'identique de la version Kotlin (ui/theme/Color.kt)
 * pour que l'identité visuelle ne change pas d'un pixel.
 */
export const colors = {
  // Fonds et surfaces
  ink: "#08080F",
  inkElevated: "#10101A",
  surface: "#151522",
  surfaceHigh: "#1B1B2B",
  border: "#262638",

  // Accents
  violet: "#8B5CF6",
  violetSoft: "#A78BFA",
  violetDeep: "#6D28D9",
  blue: "#3B82F6",
  blueSoft: "#60A5FA",
  blueDeep: "#1D4ED8",
  green: "#34D399",
  greenSoft: "#6EE7B7",
  amber: "#FBBF24",
  coral: "#F87171",

  // Textes
  textPrimary: "#F4F2FF",
  textSecondary: "#A6A3BD",
  textMuted: "#6F6C87",
} as const;

/** Dégradés de marque (tuples requis par expo-linear-gradient). */
export const gradients = {
  brand: [colors.violetDeep, colors.violet, colors.blue],
  record: [colors.violet, colors.blue],
  success: [colors.greenSoft, colors.green],
  progress: ["#FFFFFF", colors.greenSoft],
} as const;

export type AppColor = keyof typeof colors;
