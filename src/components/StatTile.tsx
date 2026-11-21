import { Text, View } from "react-native";

import { colors, typography } from "@/theme";
import { Card } from "./Card";

type StatTileProps = {
  value: string;
  label: string;
  accent: string;
};

/** Petite tuile de chiffre clé : valeur colorée, libellé discret, trait d'accent. */
export function StatTile({ value, label, accent }: StatTileProps) {
  return (
    <Card padding={14} style={{ flex: 1 }}>
      <View style={{ width: 18, height: 3, borderRadius: 999, backgroundColor: accent }} />
      <Text style={[typography.heading, { color: accent, marginTop: 10 }]}>{value}</Text>
      <Text style={[typography.labelSmall, { color: colors.textSecondary, marginTop: 2 }]}>
        {label}
      </Text>
    </Card>
  );
}
