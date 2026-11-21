import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

import { gradients } from "@/theme";

const BAR_HEIGHT = 96;
const INACTIVE_BAR = [
  "rgba(167, 139, 250, 0.9)",
  "rgba(139, 92, 246, 0.3)",
] as const;

type WeeklyBarsProps = {
  values: readonly number[];
  highlightIndex: number;
};

/**
 * Histogramme hebdomadaire : barres arrondies violettes, jour courant en vert.
 * Dessiné avec des Views natives, sans bibliothèque de graphiques.
 */
export function WeeklyBars({ values, highlightIndex }: WeeklyBarsProps) {
  const maxValue = Math.max(1, ...values);

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: BAR_HEIGHT }}>
      {values.map((value, index) => {
        const height = Math.max(6, (value / maxValue) * BAR_HEIGHT);
        const isToday = index === highlightIndex;

        return (
          <View key={`${index}-${value}`} style={{ flex: 1, paddingHorizontal: 5 }}>
            <LinearGradient
              colors={isToday ? gradients.success : INACTIVE_BAR}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ height, width: "100%", borderRadius: 999 }}
            />
          </View>
        );
      })}
    </View>
  );
}
