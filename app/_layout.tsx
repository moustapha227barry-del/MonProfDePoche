import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors } from "@/theme";

/**
 * Racine de l'application.
 *
 * Un seul Stack : la barre d'onglets vit dans le groupe `(tabs)` et l'écran
 * d'enregistrement s'ouvre par-dessus, hors de la barre (comme dans la version
 * Kotlin). Ajouter un écran de détail de cours se fera ici, sans toucher aux
 * écrans existants.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.ink },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="recording" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="course/[id]" />
        <Stack.Screen name="analysis" />
        <Stack.Screen name="settings" />
      </Stack>
    </SafeAreaProvider>
  );
}
