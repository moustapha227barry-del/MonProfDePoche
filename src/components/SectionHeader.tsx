import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, typography } from "@/theme";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Titre de section, avec une action facultative alignée à droite. */
export function SectionHeader({ title, actionLabel, onAction, style }: SectionHeaderProps) {
  return (
    <View
      style={[
        { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
        style,
      ]}
    >
      <Text style={typography.titleLarge}>{title}</Text>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          hitSlop={8}
          disabled={!onAction}
        >
          <Text
            style={[
              typography.label,
              { color: onAction ? colors.violetSoft : colors.textSecondary },
            ]}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
