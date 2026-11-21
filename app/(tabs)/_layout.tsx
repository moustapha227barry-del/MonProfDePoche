import { Tabs } from "expo-router";
import { View } from "react-native";

import { MonProfTabBar } from "@/components/MonProfTabBar";
import { colors } from "@/theme";

/**
 * Les cinq espaces de consultation. L'enregistrement n'est pas un onglet :
 * c'est une action, ouverte par le bouton central de la barre.
 */
export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.ink }}>
      <Tabs screenOptions={{ headerShown: false }} tabBar={() => <MonProfTabBar />}>
        <Tabs.Screen name="index" options={{ title: "Accueil" }} />
        <Tabs.Screen name="basket" options={{ title: "Panier" }} />
        <Tabs.Screen name="courses" options={{ title: "Cours" }} />
        <Tabs.Screen name="tutor" options={{ title: "Tuteur" }} />
        <Tabs.Screen name="progress" options={{ title: "Progrès" }} />
      </Tabs>
    </View>
  );
}
