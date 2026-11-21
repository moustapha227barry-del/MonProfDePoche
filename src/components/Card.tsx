import type { PropsWithChildren } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radii } from "@/theme";

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  backgroundColor?: string;
  radius?: number;
  padding?: number;
}>;

/**
 * Carte de base de l'application : coins très arrondis, fond légèrement plus
 * clair que l'écran, fine bordure. Toutes les cartes en héritent, ce qui
 * garantit la même identité visuelle écran après écran.
 */
export function Card({
  children,
  style,
  borderColor = "rgba(38, 38, 56, 0.7)",
  backgroundColor = colors.surface,
  radius = radii.lg,
  padding = 18,
}: CardProps) {
  return (
    <View
      style={[
        { backgroundColor, borderRadius: radius, borderWidth: 1, borderColor, padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}
