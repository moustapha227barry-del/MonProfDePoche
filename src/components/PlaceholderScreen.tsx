import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { withAlpha } from "@/lib/color";
import { colors, gradients, radii, typography } from "@/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type PlaceholderScreenProps = {
  icon: IoniconName;
  title: string;
  subtitle: string;
  features: readonly string[];
  /** Affiché seulement pour les écrans hors barre de navigation. */
  onBack?: () => void;
};

/**
 * Écran « en préparation » : il annonce ce que la section fera, sans simuler
 * une fonctionnalité qui n'existe pas encore. Chaque écran sera remplacé par
 * sa vraie implémentation, sans toucher à la navigation.
 */
export function PlaceholderScreen({
  icon,
  title,
  subtitle,
  features,
  onBack,
}: PlaceholderScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.ink }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 8,
        paddingBottom: 120,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={onBack}
          hitSlop={10}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          <Text style={[typography.label, { color: colors.textSecondary }]}>Retour</Text>
        </Pressable>
      ) : null}

      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 72,
          height: 72,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 10,
        }}
      >
        <Ionicons name={icon} size={30} color="#FFFFFF" />
      </LinearGradient>

      <View
        style={{
          alignSelf: "flex-start",
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 5,
          backgroundColor: withAlpha(colors.violet, 0.16),
          borderWidth: 1,
          borderColor: withAlpha(colors.violet, 0.35),
        }}
      >
        <Text style={[typography.labelSmall, { color: colors.violetSoft }]}>EN PRÉPARATION</Text>
      </View>

      <Text style={typography.headline}>{title}</Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: -6 }]}>
        {subtitle}
      </Text>

      <Card style={{ marginTop: 6, gap: 14 }} radius={radii.lg}>
        {features.map((feature) => (
          <View key={feature} style={{ flexDirection: "row", gap: 12 }}>
            <Ionicons name="checkmark-circle" size={20} color={colors.green} />
            <Text style={[typography.bodySmall, { flex: 1, color: colors.textPrimary }]}>
              {feature}
            </Text>
          </View>
        ))}
      </Card>

      <Text style={[typography.labelSmall, { color: colors.textMuted, textAlign: "center" }]}>
        Cette section sera développée à la prochaine étape, sans reconstruire l’application.
      </Text>
    </ScrollView>
  );
}
