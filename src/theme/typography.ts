import type { TextStyle } from "react-native";

/**
 * Échelle typographique reprise de la version Kotlin (ui/theme/Type.kt).
 * Les tailles sont exprimées en points, identiques aux sp Android.
 */
export const typography = {
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: "#F4F2FF",
  },
  headline: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: "#F4F2FF",
  },
  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600",
    letterSpacing: -0.2,
    color: "#F4F2FF",
  },
  titleLarge: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "600",
    color: "#F4F2FF",
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#F4F2FF",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
    color: "#F4F2FF",
  },
  bodySmall: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: "400",
    color: "#A6A3BD",
  },
  label: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
    color: "#F4F2FF",
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "#A6A3BD",
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
    color: "#6F6C87",
  },
} satisfies Record<string, TextStyle>;

export type TypographyKey = keyof typeof typography;
