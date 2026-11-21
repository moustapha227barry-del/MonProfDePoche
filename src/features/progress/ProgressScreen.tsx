import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { GradientButton } from "@/components/GradientButton";
import { StatTile } from "@/components/StatTile";
import { WeeklyBars } from "@/components/WeeklyBars";
import type { ProgressSnapshot } from "@/domain/course";
import { getSubject } from "@/domain/subject";
import { withAlpha } from "@/lib/color";
import { formatDuration } from "@/lib/format";
import { accuracyPercent, computeProgress } from "@/lib/progress";
import { notionsToReview } from "@/lib/course";
import {
  courseRepository,
  progressRepository,
  recordingRepository,
} from "@/services/storage/local";
import { colors, typography } from "@/theme";

const WEEK_DAYS = ["L", "M", "M", "J", "V", "S", "D"] as const;

type ReviewItem = ReturnType<typeof notionsToReview>[number];

/**
 * Progression réelle : enregistrements, chapitres étudiés, maîtrise des
 * notions et résultats d'exercices. Aucune valeur n'est simulée ; quand il n'y
 * a pas encore de données, l'écran l'indique et propose d'enregistrer.
 */
export function ProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [courses, recordings, progress] = await Promise.all([
        courseRepository.list(),
        recordingRepository.list(),
        progressRepository.load(),
      ]);
      setSnapshot(
        computeProgress({
          courses,
          recordings,
          results: progress.exerciseResults,
          revisionsDue: progress.revisions.length,
        }),
      );
      setReview(notionsToReview(courses).slice(0, 5));
      setError(null);
    } catch (cause) {
      console.warn("[progression] lecture impossible", cause);
      setError("La progression n’a pas pu être calculée.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const todayIndex = (new Date().getDay() + 6) % 7;
  const hasData = snapshot !== null && (snapshot.totalCourses > 0 || snapshot.totalMinutes > 0);

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
      <View style={{ paddingTop: 8 }}>
        <Text style={[typography.labelMedium, { color: colors.greenSoft }]}>
          CALCULÉ SUR TES DONNÉES
        </Text>
        <Text style={[typography.heading, { marginTop: 2 }]}>Ma progression</Text>
      </View>

      {loading ? (
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <ActivityIndicator color={colors.violetSoft} />
            <Text style={[typography.bodySmall, { flex: 1 }]}>Calcul de la progression…</Text>
          </View>
        </Card>
      ) : error ? (
        <Card borderColor={withAlpha(colors.coral, 0.4)}>
          <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>{error}</Text>
        </Card>
      ) : !hasData ? (
        <View style={{ gap: 14 }}>
          <Card style={{ alignItems: "center", gap: 10, paddingVertical: 28 }} padding={20}>
            <Ionicons name="stats-chart" size={34} color={colors.violetSoft} />
            <Text style={[typography.titleLarge, { textAlign: "center" }]}>
              Rien à mesurer pour l’instant
            </Text>
            <Text
              style={[
                typography.bodySmall,
                { textAlign: "center", color: colors.textSecondary },
              ]}
            >
              Enregistre un premier cours : le temps, la régularité et les chapitres
              étudiés apparaîtront ici, sans aucune donnée inventée.
            </Text>
          </Card>
          <GradientButton
            text="Enregistrer un cours"
            icon="mic"
            onPress={() => router.push("/recording")}
          />
        </View>
      ) : snapshot ? (
        <>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <StatTile
              value={formatDuration(snapshot.totalMinutes)}
              label="Temps enregistré"
              accent={colors.violetSoft}
            />
            <StatTile
              value={String(snapshot.totalCourses)}
              label="Cours analysés"
              accent={colors.blueSoft}
            />
            <StatTile
              value={`${snapshot.studiedChapters}/${snapshot.totalChapters}`}
              label="Chapitres étudiés"
              accent={colors.green}
            />
          </View>

          <Card>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={typography.title}>Cette semaine</Text>
                <Text
                  style={[typography.labelMedium, { color: colors.textSecondary, marginTop: 2 }]}
                >
                  {formatDuration(snapshot.weekMinutes.reduce((sum, value) => sum + value, 0))}{" "}
                  enregistrées
                </Text>
              </View>
              <Text style={[typography.labelMedium, { color: colors.greenSoft }]}>
                {snapshot.activeDays} jour{snapshot.activeDays > 1 ? "s" : ""} actif
                {snapshot.activeDays > 1 ? "s" : ""}
              </Text>
            </View>

            <View style={{ marginTop: 18 }}>
              <WeeklyBars values={snapshot.weekMinutes} highlightIndex={todayIndex} />
            </View>

            <View style={{ flexDirection: "row", marginTop: 10 }}>
              {WEEK_DAYS.map((day, index) => (
                <Text
                  key={`${day}-${index}`}
                  style={[typography.labelSmall, { flex: 1, textAlign: "center" }]}
                >
                  {day}
                </Text>
              ))}
            </View>

            <Text style={[typography.labelSmall, { color: colors.textSecondary, marginTop: 10 }]}>
              Série en cours : {snapshot.streakDays} jour{snapshot.streakDays > 1 ? "s" : ""}
            </Text>
          </Card>

          <Card style={{ gap: 12 }}>
            <Text style={typography.title}>Maîtrise par matière</Text>
            {snapshot.masteryBySubject.length === 0 ? (
              <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                La maîtrise apparaîtra après une analyse de cours.
              </Text>
            ) : (
              snapshot.masteryBySubject.map((item) => {
                const subject = getSubject(item.subject);
                return (
                  <View key={item.subject} style={{ gap: 5 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={[typography.labelSmall, { flex: 1, color: subject.accent }]}>
                        {subject.label}
                      </Text>
                      <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
                        {item.masteryPercent} %
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 6,
                        borderRadius: 999,
                        backgroundColor: "rgba(255,255,255,0.08)",
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: 6,
                          width: `${item.masteryPercent}%`,
                          borderRadius: 999,
                          backgroundColor: item.masteryPercent >= 70 ? colors.green : colors.violetSoft,
                        }}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </Card>

          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[typography.title, { flex: 1 }]}>Notions à revoir</Text>
              <Text style={[typography.labelSmall, { color: colors.amber }]}>
                {snapshot.notionsToReview} sur {snapshot.totalNotions}
              </Text>
            </View>
            {review.length === 0 ? (
              <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                Aucune notion sous 50 % de maîtrise.
              </Text>
            ) : (
              review.map((item) => (
                <Pressable
                  key={`${item.courseId}-${item.notion.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Ouvrir ${item.notion.title}`}
                  onPress={() => router.push(`/course/${item.courseId}`)}
                  style={{ paddingVertical: 4 }}
                >
                  <Text numberOfLines={1} style={[typography.bodySmall, { color: colors.textPrimary }]}>
                    • {item.notion.title}
                  </Text>
                  <Text style={[typography.labelSmall, { color: colors.textMuted }]}>
                    {item.courseTitle} · {item.notion.masteryPercent} %
                  </Text>
                </Pressable>
              ))
            )}
          </Card>

          <Card>
            <Text style={typography.title}>Exercices</Text>
            {snapshot.exerciseResults === 0 ? (
              <Text
                style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 6 }]}
              >
                Aucun exercice enregistré pour l’instant. Les résultats s’ajouteront ici dès
                que des exercices seront faits avec le tuteur.
              </Text>
            ) : (
              <Text style={[typography.bodySmall, { color: colors.textPrimary, marginTop: 6 }]}>
                {snapshot.exerciseCorrect}/{snapshot.exerciseResults} bonnes réponses ·{" "}
                {accuracyPercent(snapshot.exerciseCorrect, snapshot.exerciseResults)} %
              </Text>
            )}
            <Text style={[typography.labelSmall, { color: colors.textMuted, marginTop: 8 }]}>
              {snapshot.notionsMastered} notion{snapshot.notionsMastered > 1 ? "s" : ""}{" "}
              maîtrisée{snapshot.notionsMastered > 1 ? "s" : ""} (≥ 80 %)
            </Text>
          </Card>

          <Text style={[typography.labelSmall, { textAlign: "center", color: colors.textMuted }]}>
            Progression calculée à partir de tes enregistrements, de tes cours et de tes
            résultats. Aucune donnée simulée.
          </Text>
        </>
      ) : null}
    </ScrollView>
  );
}
