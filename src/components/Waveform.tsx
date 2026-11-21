import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

import { colors } from "@/theme";

type WaveformProps = {
  /** Hauteurs normalisées 0 → 1, une par barre. */
  levels: readonly number[];
  /** L'onde s'illumine seulement pendant la capture. */
  active: boolean;
  height?: number;
};

/**
 * Onde sonore du micro : chaque barre reflète le niveau réel capté par
 * `expo-audio`. Au repos (ou en pause), les barres restent plates et éteintes :
 * aucune animation ne simule un son qui n'existe pas.
 */
export function Waveform({ levels, active, height = 88 }: WaveformProps) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={active ? "Niveau du microphone en direct" : "Onde au repos"}
      style={{
        height,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 3,
      }}
    >
      {levels.map((level, index) => {
        const barHeight = Math.max(4, level * height);
        return (
          <View
            key={index}
            style={{
              flex: 1,
              height: barHeight,
              borderRadius: 999,
              overflow: "hidden",
              backgroundColor: active ? colors.violetSoft : colors.border,
              opacity: active ? 0.35 + level * 0.65 : 0.6,
            }}
          >
            {active ? (
              <LinearGradient
                colors={[colors.violet, colors.blueSoft]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
