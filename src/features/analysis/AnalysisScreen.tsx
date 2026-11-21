import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { GradientButton } from "@/components/GradientButton";
import type { Course } from "@/domain/course";
import type { PreparedAnalysisBatch } from "@/lib/basket";
import { backendBaseUrl, describeAiError, isRetryable } from "@/lib/ai";
import { courseStats } from "@/lib/course";
import { withAlpha } from "@/lib/color";
import { formatRecordingDuration } from "@/lib/recording";
import { createHttpAnalysisService } from "@/services/ai/httpAnalysisService";
import {
  analysisBatchRepository,
  courseRepository,
  profileRepository,
  recordingRepository,
} from "@/services/storage/local";
import { colors, radii, typography } from "@/theme";

/**
 * Envoi réel du lot préparé au backend sécurisé.
 *
 * Sans backend, sans consentement ou sans lot, l'écran refuse de lancer quoi
 * que ce soit et explique pourquoi : aucun cours simulé n'est créé.
 */
export function AnalysisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [batch, setBatch] = useState<PreparedAnalysisBatch | null>(null);
  const [consent, setConsent] = useState(true);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);

  const backend = useMemo(() => backendBaseUrl(), []);
  const service = useMemo(() => createHttpAnalysisService(), []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [prepared, profile] = await Promise.all([
          analysisBatchRepository.get(),
          profileRepository.load(),
        ]);
        if (!active) return;
        setBatch(prepared);
        setConsent(profile.privacy.aiProcessingConsent);
      } catch (cause) {
        console.warn("[analyse] préparation illisible", cause);
        if (active) setError("Le lot préparé n’a pas pu être relu.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const run = useCallback(async () => {
    if (!batch || running || !consent) return;
    setRunning(true);
    setError(null);
    setCanRetry(false);
    try {
      const result = await service.analyse({ batch, language: "fr" });
      await courseRepository.save(result.course);
      await recordingRepository.attachCourse(result.course.recordingIds, result.course.id);
      await analysisBatchRepository.clear();
      setBatch(null);
      setCourse(result.course);
    } catch (cause) {
      console.warn("[analyse] échec", cause);
      setError(describeAiError(cause));
      setCanRetry(isRetryable(cause));
    } finally {
      setRunning(false);
    }
  }, [batch, consent, running, service]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.ink }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 32,
        gap: 16,
      }}
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
        <Text style={[typography.title, { flex: 1, textAlign: "right" }]}>Analyse IA</Text>
      </View>

      {loading ? (
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <ActivityIndicator color={colors.violetSoft} />
            <Text style={[typography.bodySmall, { flex: 1 }]}>Lecture du lot préparé…</Text>
          </View>
        </Card>
      ) : course ? (
        <CourseReady course={course} onOpen={() => router.replace(`/course/${course.id}`)} />
      ) : !batch ? (
        <View style={{ gap: 14 }}>
          <Card style={{ alignItems: "center", gap: 8, paddingVertical: 24 }} padding={20}>
            <Ionicons name="layers-outline" size={32} color={colors.violetSoft} />
            <Text style={[typography.titleLarge, { textAlign: "center" }]}>
              Aucun lot préparé
            </Text>
            <Text
              style={[typography.bodySmall, { textAlign: "center", color: colors.textSecondary }]}
            >
              Sélectionne des enregistrements dans le panier, puis touche « Préparer
              l’analyse » avant de lancer l’analyse.
            </Text>
          </Card>
          <GradientButton
            text="Ouvrir le panier"
            icon="layers"
            onPress={() => router.replace("/basket")}
          />
        </View>
      ) : !consent ? (
        <Card borderColor={withAlpha(colors.amber, 0.4)}>
          <Text style={typography.title}>Envoi non autorisé</Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 6 }]}>
            L’envoi des cours au service IA est désactivé dans tes paramètres de
            confidentialité. Active-le pour lancer l’analyse, ou désactive l’analyse.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/settings")}
            style={{ paddingVertical: 10 }}
          >
            <Text style={[typography.label, { color: colors.amber }]}>
              Ouvrir les paramètres
            </Text>
          </Pressable>
        </Card>
      ) : (
        <>
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="layers" size={20} color={colors.violetSoft} />
              <Text style={[typography.title, { flex: 1 }]}>Lot sélectionné</Text>
              <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
                {batch.files.length} fichier{batch.files.length > 1 ? "s" : ""}
              </Text>
            </View>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              Durée totale : {formatRecordingDuration(batch.totalDurationMs)}
            </Text>
            {batch.files.map((file) => (
              <Text
                key={file.recordingId}
                numberOfLines={1}
                style={[typography.labelSmall, { color: colors.textPrimary }]}
              >
                • {file.title}
              </Text>
            ))}
          </Card>

          {!backend ? (
            <Card borderColor={withAlpha(colors.amber, 0.4)}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Ionicons name="cloud-offline" size={20} color={colors.amber} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={typography.title}>Backend non configuré</Text>
                  <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                    Ajoute EXPO_PUBLIC_API_URL dans le fichier .env, redémarre Expo, puis
                    reviens ici. Aucune analyse simulée n’est produite en attendant.
                  </Text>
                </View>
              </View>
            </Card>
          ) : null}

          {running ? (
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <ActivityIndicator color={colors.greenSoft} />
                <View style={{ flex: 1 }}>
                  <Text style={typography.title}>Analyse en cours…</Text>
                  <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
                    Transcription puis structuration. Cela peut prendre plusieurs minutes ;
                    garde l’application ouverte.
                  </Text>
                </View>
              </View>
            </Card>
          ) : (
            <GradientButton
              text="Lancer l’analyse"
              icon="sparkles"
              onPress={() => void run()}
            />
          )}

          {error ? (
            <Card borderColor={withAlpha(colors.coral, 0.4)}>
              <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>{error}</Text>
              {canRetry && !running ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void run()}
                  style={{ paddingVertical: 10 }}
                >
                  <Text style={[typography.label, { color: colors.violetSoft }]}>Réessayer</Text>
                </Pressable>
              ) : null}
            </Card>
          ) : null}

          <Text style={[typography.labelSmall, { textAlign: "center", color: colors.textMuted }]}>
            Les fichiers restent sur ton téléphone : ils sont envoyés uniquement pour cette
            analyse, à ton backend sécurisé.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

function CourseReady({ course, onOpen }: { course: Course; onOpen: () => void }) {
  const stats = courseStats(course);
  return (
    <View style={{ gap: 14 }}>
      <View
        style={{
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: withAlpha(colors.green, 0.45),
          backgroundColor: withAlpha(colors.green, 0.08),
          padding: 18,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="checkmark-circle" size={22} color={colors.green} />
          <Text style={typography.title}>Analyse terminée</Text>
        </View>
        <Text style={typography.titleLarge}>{course.title}</Text>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
          {stats.chapters} chapitres · {stats.notions} notions
          {course.uncertainties.length > 0
            ? ` · ${course.uncertainties.length} passage${
                course.uncertainties.length > 1 ? "s" : ""
              } incertain${course.uncertainties.length > 1 ? "s" : ""} signalé${
                course.uncertainties.length > 1 ? "s" : ""
              }`
            : ""}
        </Text>
        <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
          Le cours est enregistré sur le téléphone et relié à ses enregistrements d’origine.
        </Text>
      </View>
      <GradientButton text="Ouvrir le cours" icon="book" onPress={onOpen} />
    </View>
  );
}
