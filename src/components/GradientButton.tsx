import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, gradients, radii } from "@/theme";

type GradientButtonProps = {
  text: string;
  onPress: () => void;
  icon?: ComponentProps<typeof Ionicons>["name"];
  style?: StyleProp<ViewStyle>;
};

/** Bouton principal de l'application, reconnaissable à son dégradé violet → bleu. */
export function GradientButton({ text, onPress, icon, style }: GradientButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text}
      onPress={onPress}
      android_ripple={{ color: "rgba(255, 255, 255, 0.18)" }}
      style={({ pressed }) => [styles.pressable, style, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={gradients.record}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {icon ? <Ionicons name={icon} size={20} color="#FFFFFF" /> : null}
        <Text style={styles.label}>{text}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    height: 56,
    borderRadius: radii.md,
    overflow: "hidden",
    shadowColor: colors.violet,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  pressed: {
    opacity: 0.9,
  },
  gradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
