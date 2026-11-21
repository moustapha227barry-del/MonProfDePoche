import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { GradientButton } from "@/components/GradientButton";
import { withAlpha } from "@/lib/color";
import {
  eraseAllUserData,
  profileRepository,
} from "@/services/storage/local";
import { colors, radii, typography } from "@/theme";

/**
 * Compte local et paramètres.
 *
 * L'authentification e-mail / Google n'est pas encore branchée : les boutons
 * sont volontairement inactifs et l'écran explique ce qui manque (backend
 * d'authentification). Aucun faux compte n'est créé.
 */
export function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [aiConsent, setAiConsent] = useState(true);
  const [cloudBackup, setCloudBackup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void profileRepository
      .load()
      .then((profile) => {
        if (!active) return;
        setDisplayName(profile.displayName);
        setEmail(profile.email ?? "");
        setAiConsent(profile.privacy.aiProcessingConsent);
        setCloudBackup(profile.privacy.cloudBackup);
      })
      .catch((cause) => {
        console.warn("[paramètres] profil illisible", cause);
        if (active) setError("Le profil local n’a pas pu être lu.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const current = await profileRepository.load();
      const saved = await profileRepository.save({
        ...current,
        displayName,
        email: email.trim() ? email : null,
        privacy: { aiProcessingConsent: aiConsent, cloudBackup },
      });
      setDisplayName(saved.displayName);
      setEmail(saved.email ?? "");
      setNotice("Paramètres enregistrés sur le téléphone.");
    } catch (cause) {
      console.warn("[paramètres] sauvegarde impossible", cause);
      setError("Les paramètres n’ont pas pu être enregistrés.");
    } finally {
      setSaving(false);
    }
  }, [aiConsent, cloudBackup, displayName, email]);

  const erase = useCallback(() => {
    Alert.alert(
      "Supprimer toutes mes données ?",
      "Enregistrements audio, cours, progression et profil seront effacés du téléphone. Cette action est définitive.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Continuer",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirmer la suppression",
              "Aucune sauvegarde cloud n’est active : les données ne pourront pas être restaurées.",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Tout supprimer",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const result = await eraseAllUserData();
                      const profile = await profileRepository.load();
                      setDisplayName(profile.displayName);
                      setEmail("");
                      setAiConsent(profile.privacy.aiProcessingConsent);
                      setCloudBackup(profile.privacy.cloudBackup);
                      setNotice(
                        `Données supprimées : ${result.recordings} enregistrement${
                          result.recordings > 1 ? "s" : ""
                        } et tous les cours.`,
                      );
                      setError(null);
                    } catch (cause) {
                      console.warn("[paramètres] suppression impossible", cause);
                      setError("Les données n’ont pas pu être supprimées.");
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, []);

  const version = Constants.expoConfig?.version ?? "0.0.0";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.ink }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 32,
        gap: 16,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={() => router.back()}
          hitSlop={10}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          <Text style={[typography.label, { color: colors.textSecondary }]}>Retour</Text>
        </Pressable>
        <Text style={[typography.title, { flex: 1, textAlign: "right" }]}>Paramètres</Text>
      </View>

      <Text style={[typography.labelMedium, { color: colors.violetSoft }]}>
        COMPTE LOCAL
      </Text>

      <Card style={{ gap: 12 }}>
        <Text style={typography.title}>Mon profil</Text>
        <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
          Ces informations restent sur le téléphone. Aucun envoi n’est effectué.
        </Text>

        <Text style={typography.labelMedium}>Nom affiché</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={60}
          placeholder="Élève"
          placeholderTextColor={colors.textMuted}
          style={inputStyle}
        />

        <Text style={typography.labelMedium}>E-mail (facultatif)</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="prenom@exemple.com"
          placeholderTextColor={colors.textMuted}
          style={inputStyle}
        />
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={typography.title}>Inscription et connexion</Text>
        <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
          La connexion e-mail et Google n’est pas encore active : elle nécessite le backend
          d’authentification sécurisé. Aucun compte fictif n’est créé en attendant.
        </Text>

        <AuthRow icon="mail" label="Continuer avec un e-mail" />
        <AuthRow icon="logo-google" label="Continuer avec Google" />
        <Text style={[typography.labelSmall, { color: colors.textMuted }]}>
          Prochaine étape : brancher le backend et activer ces deux boutons.
        </Text>
      </Card>

      <Card style={{ gap: 14 }}>
        <Text style={typography.title}>Confidentialité</Text>

        <SwitchRow
          label="Envoyer mes cours au service IA"
          description="Nécessaire pour l’analyse et le tuteur. Les fichiers sont envoyés uniquement quand tu lances une action."
          value={aiConsent}
          onChange={setAiConsent}
        />

        <SwitchRow
          label="Sauvegarde cloud (à venir)"
          description="Aucune sauvegarde n’est active aujourd’hui. Cette option prépare la future synchronisation chiffrée."
          value={cloudBackup}
          onChange={setCloudBackup}
        />
      </Card>

      {notice ? (
        <Card borderColor={withAlpha(colors.green, 0.4)}>
          <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>{notice}</Text>
        </Card>
      ) : null}
      {error ? (
        <Card borderColor={withAlpha(colors.coral, 0.4)}>
          <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>{error}</Text>
        </Card>
      ) : null}

      {loading ? (
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <ActivityIndicator color={colors.violetSoft} />
            <Text style={[typography.bodySmall, { flex: 1 }]}>Chargement du profil…</Text>
          </View>
        </Card>
      ) : saving ? (
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <ActivityIndicator color={colors.greenSoft} />
            <Text style={[typography.bodySmall, { flex: 1 }]}>Enregistrement…</Text>
          </View>
        </Card>
      ) : (
        <GradientButton text="Enregistrer les paramètres" icon="save" onPress={() => void save()} />
      )}

      <Card borderColor={withAlpha(colors.coral, 0.35)} style={{ gap: 10 }}>
        <Text style={[typography.title, { color: colors.coral }]}>Mes données</Text>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
          Supprimer le compte local efface les enregistrements audio, les cours, la
          progression et le profil de ce téléphone. Aucune copie n’est conservée.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Supprimer toutes mes données"
          onPress={erase}
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            borderRadius: 999,
            paddingHorizontal: 13,
            paddingVertical: 9,
            backgroundColor: withAlpha(colors.coral, 0.14),
            borderWidth: 1,
            borderColor: withAlpha(colors.coral, 0.4),
          }}
        >
          <Ionicons name="trash-outline" size={15} color={colors.coral} />
          <Text style={[typography.labelSmall, { color: colors.coral }]}>
            Supprimer toutes mes données
          </Text>
        </Pressable>
      </Card>

      <Text style={[typography.labelSmall, { textAlign: "center", color: colors.textMuted }]}>
        Mon Prof de Poche · version {version} · données stockées sur l’appareil
      </Text>
    </ScrollView>
  );
}

const inputStyle = {
  height: 48,
  borderRadius: radii.md,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.surfaceHigh,
  paddingHorizontal: 14,
  color: colors.textPrimary,
  fontSize: 15,
} as const;

function SwitchRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={typography.label}>{label}</Text>
        <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: withAlpha(colors.violet, 0.6) }}
        thumbColor={value ? colors.violetSoft : colors.textMuted}
      />
    </View>
  );
}

function AuthRow({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        height: 50,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.inkElevated,
        paddingHorizontal: 14,
        opacity: 0.55,
      }}
    >
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={[typography.label, { flex: 1, color: colors.textSecondary }]}>{label}</Text>
      <View
        style={{
          borderRadius: 999,
          paddingHorizontal: 8,
          paddingVertical: 3,
          backgroundColor: withAlpha(colors.violet, 0.16),
        }}
      >
        <Text style={[typography.labelSmall, { color: colors.violetSoft }]}>BIENTÔT</Text>
      </View>
    </View>
  );
}
