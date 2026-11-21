export { colors, gradients } from "./colors";
export type { AppColor } from "./colors";
export { typography } from "./typography";
export type { TypographyKey } from "./typography";

/** Rayons de cartes, identiques à la version Kotlin (Shapes). */
export const radii = {
  xs: 10,
  sm: 14,
  md: 20,
  lg: 24,
  xl: 28,
  pill: 999,
} as const;

/** Espacements verticaux / horizontaux utilisés par les écrans. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  screen: 20,
} as const;
