import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, gradients, typography } from "@/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type TabItem = {
  /** Chemin Expo Router du fichier d'écran. */
  href: string;
  label: string;
};

const LEFT_TABS: readonly TabItem[] = [
  { href: "/", label: "Accueil" },
  { href: "/basket", label: "Panier" },
];

const RIGHT_TABS: readonly TabItem[] = [
  { href: "/courses", label: "Cours" },
  { href: "/tutor", label: "Tuteur" },
  { href: "/progress", label: "Progrès" },
];

const ICONS: Record<string, IoniconName> = {
  "/": "home",
  "/basket": "layers",
  "/courses": "book",
  "/tutor": "chatbubble-ellipses",
  "/progress": "stats-chart",
};

/**
 * Barre de navigation sur mesure : cinq espaces de consultation et, au centre,
 * le bouton d'enregistrement légèrement surélevé. Le bouton fait partie de la
 * barre (et non d'un élément flottant) pour ne jamais recouvrir le contenu.
 */
export function MonProfTabBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Cinq colonnes de largeur égale, comme la barre d'origine.
  const itemWidth = (width - 12) / 5;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.inkElevated,
        borderTopWidth: 1,
        borderTopColor: "rgba(38, 38, 56, 0.6)",
        paddingHorizontal: 6,
        paddingTop: 6,
        paddingBottom: Math.max(6, insets.bottom),
      }}
    >
      {LEFT_TABS.map((tab) => (
        <TabButton key={tab.href} tab={tab} width={itemWidth} />
      ))}

      <View style={{ width: itemWidth, alignItems: "center" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nouvel enregistrement"
          onPress={() => router.push("/recording")}
          style={({ pressed }) => ({
            width: 54,
            height: 54,
            borderRadius: 27,
            marginTop: -20,
            overflow: "hidden",
            shadowColor: colors.violet,
            shadowOpacity: 0.55,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
            elevation: 12,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <LinearGradient
            colors={gradients.record}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="mic" size={24} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>

      {RIGHT_TABS.map((tab) => (
        <TabButton key={tab.href} tab={tab} width={itemWidth} />
      ))}
    </View>
  );
}

function TabButton({ tab, width }: { tab: TabItem; width: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const active = pathname === tab.href;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={tab.label}
      onPress={() => router.navigate(tab.href)}
      style={{ width, alignItems: "center", justifyContent: "center", paddingVertical: 2 }}
    >
      <View
        style={{
          width: 40,
          height: 26,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: active ? "rgba(139, 92, 246, 0.18)" : "transparent",
        }}
      >
        <Ionicons
          name={ICONS[tab.href] ?? "ellipse"}
          size={20}
          color={active ? colors.violetSoft : colors.textMuted}
        />
      </View>
      <Text
        numberOfLines={1}
        style={[
          typography.labelSmall,
          {
            fontSize: 10,
            marginTop: 3,
            color: active ? colors.textPrimary : colors.textMuted,
          },
        ]}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}
