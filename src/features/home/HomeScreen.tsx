import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SectionHeader } from "@/components/SectionHeader";
import { GradientButton } from "@/components/GradientButton";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";
import { WeeklyBars } from "@/components/WeeklyBars";
import { getSubject } from "@/domain/subject";
import {
  DEMO_HOME_STATE,
  goalProgress,
  weekTotalMinutes,
  type HomeUiState,
  type RecentCourse,
  type RevisionReminder,
} from "@/features/home/homeState";
import { withAlpha } from "@/lib/color";
import { formatDuration } from "@/lib/format";
import { colors, gradients, radii, typography } from "@/theme";

const WEEK_DAYS = ["L", "M", "M", "J", "V", "S", "D"] as const;

type HomeScreenProps = {
  state?: HomeUiState;
};

/**
 * Écran d'accueil : objectif du jour, chiffres clés, activité de la semaine,
 * cours récents, analyses en attente et révision du jour.
 */
export function HomeScreen({ state = DEMO_HOME_STATE }: HomeScreenProps) {
  const router = useRouter();
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
      <HomeHeader streakDays={state.streakDays} />

      <DailyGoalCard state={state} />

      <GradientButton
        text="Nouvel enregistrement"
        icon="mic"
        onPress={() => router.push("/recording")}
      />

      <View style={{ flexDirection: "row", gap: 12 }}>
        <StatTile value={String(state.coursesToday)} label="Cours aujourd’hui" accent={colors.violetSoft} />
        <StatTile value={String(state.pendingAnalyses)} label="À analyser" accent={colors.blueSoft} />
        <StatTile value={String(state.revisionsDue)} label="À réviser" accent={colors.green} />
      </View>

      <WeekActivityCard state={state} />

      <SectionHeader
        title="Cours récents"
        actionLabel="Tout voir"
        onAction={() => router.navigate("/courses")}
        style={{ marginTop: 6 }}
      />

      {state.recentCourses.map((course) => (
        <RecentCourseCard key={course.id} course={course} />
      ))}

      <PendingAnalysisCard
        count={state.pendingAnalyses}
        onOpenBasket={() => router.navigate("/basket")}
      />

      <RevisionCard
        revision={state.revision}
        onOpenProgress={() => router.navigate("/progress")}
      />

      <Text style={[typography.labelSmall, { textAlign: "center", marginTop: 4 }]}>
        Aperçu · données de démonstration
      </Text>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// En-tête
// ---------------------------------------------------------------------------

function HomeHeader({ streakDays }: { streakDays: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 8 }}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.label, { color: colors.textSecondary }]}>Bonjour 👋</Text>
        <Text style={[typography.heading, { marginTop: 2 }]}>Prêt à réviser ?</Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 6,
          backgroundColor: colors.surfaceHigh,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={typography.labelMedium}>🔥</Text>
        <Text style={[typography.labelMedium, { color: colors.amber, marginLeft: 5 }]}>
          {streakDays} j
        </Text>
      </View>

      <LinearGradient
        colors={gradients.record}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 10,
        }}
      >
        <Text style={[typography.title, { color: "#FFFFFF" }]}>M</Text>
      </LinearGradient>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Objectif du jour
// ---------------------------------------------------------------------------

function DailyGoalCard({ state }: { state: HomeUiState }) {
  const progress = goalProgress(state);

  return (
    <View style={{ borderRadius: radii.xl, overflow: "hidden" }}>
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 22 }}
      >
        {/* Halos décoratifs : donnent de la profondeur au dégradé. */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: 260,
            height: 260,
            borderRadius: 130,
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            top: -90,
            right: -80,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: 190,
            height: 190,
            borderRadius: 95,
            backgroundColor: withAlpha(colors.green, 0.12),
            bottom: -100,
            left: -60,
          }}
        />

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={[typography.label, { flex: 1, color: "rgba(255, 255, 255, 0.85)" }]}>
            Objectif du jour
          </Text>
          <View
            style={{
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
              backgroundColor: "rgba(255, 255, 255, 0.16)",
            }}
          >
            <Text style={[typography.labelMedium, { color: "#FFFFFF" }]}>
              {Math.round(progress * 100)} %
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 10 }}>
          <Text style={[typography.display, { color: "#FFFFFF" }]}>
            {formatDuration(state.recordedMinutes)}
          </Text>
          <Text
            style={[
              typography.bodySmall,
              { color: "rgba(255, 255, 255, 0.72)", marginLeft: 8, marginBottom: 5 },
            ]}
          >
            sur {formatDuration(state.goalMinutes)}
          </Text>
        </View>

        <View
          style={{
            height: 10,
            borderRadius: 999,
            backgroundColor: "rgba(255, 255, 255, 0.18)",
            marginTop: 16,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={gradients.progress}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 10, width: `${progress * 100}%`, borderRadius: 999 }}
          />
        </View>

        <Text
          style={[
            typography.labelMedium,
            { color: "rgba(255, 255, 255, 0.85)", marginTop: 14 },
          ]}
        >
          {state.coursesToday} cours aujourd’hui · {state.pendingAnalyses} à analyser
        </Text>
      </LinearGradient>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Activité de la semaine
// ---------------------------------------------------------------------------

function WeekActivityCard({ state }: { state: HomeUiState }) {
  const activeDays = state.weekMinutes.filter((minutes) => minutes > 0).length;

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={typography.title}>Cette semaine</Text>
          <Text style={[typography.labelMedium, { color: colors.textSecondary, marginTop: 2 }]}>
            {formatDuration(weekTotalMinutes(state))}
          </Text>
        </View>
        <Text style={[typography.labelMedium, { color: colors.greenSoft }]}>
          {activeDays} jours actifs
        </Text>
      </View>

      <View style={{ marginTop: 18 }}>
        <WeeklyBars values={state.weekMinutes} highlightIndex={state.todayIndex} />
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
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Cours récents
// ---------------------------------------------------------------------------

function RecentCourseCard({ course }: { course: RecentCourse }) {
  const subject = getSubject(course.subject);
  const statusColor = course.analysed ? colors.green : colors.blueSoft;

  return (
    <Card padding={16}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: withAlpha(subject.accent, 0.16),
          }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: subject.accent,
            }}
          />
        </View>

        <View style={{ flex: 1, marginLeft: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text numberOfLines={1} style={[typography.title, { flex: 1 }]}>
              {course.title}
            </Text>
            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 5,
                marginLeft: 8,
                backgroundColor: withAlpha(statusColor, 0.14),
              }}
            >
              <Text style={[typography.labelSmall, { color: statusColor }]}>
                {course.analysed ? "Analysé" : "En attente"}
              </Text>
            </View>
          </View>

          <Text
            numberOfLines={1}
            style={[typography.labelMedium, { color: colors.textSecondary, marginTop: 3 }]}
          >
            {course.chapter}
          </Text>
          <Text numberOfLines={1} style={[typography.labelSmall, { marginTop: 6 }]}>
            {subject.label} · {formatDuration(course.durationMinutes)} · {course.timeLabel}
          </Text>
        </View>
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Analyses en attente et révision
// ---------------------------------------------------------------------------

function PendingAnalysisCard({
  count,
  onOpenBasket,
}: {
  count: number;
  onOpenBasket: () => void;
}) {
  return (
    <Card borderColor={withAlpha(colors.blue, 0.35)}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: withAlpha(colors.blue, 0.16),
          }}
        >
          <Ionicons name="layers" size={22} color={colors.blueSoft} />
        </View>

        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={typography.title}>{count} analyses en attente</Text>
          <Text
            style={[typography.labelMedium, { color: colors.textSecondary, marginTop: 3 }]}
          >
            Sélectionnez jusqu’à 5 enregistrements pour les structurer ensemble.
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onOpenBasket}
        hitSlop={8}
        style={{ paddingVertical: 8 }}
      >
        <Text style={[typography.label, { color: colors.blueSoft }]}>Ouvrir le panier</Text>
      </Pressable>
    </Card>
  );
}

function RevisionCard({
  revision,
  onOpenProgress,
}: {
  revision: RevisionReminder;
  onOpenProgress: () => void;
}) {
  const subject = getSubject(revision.subject);
  const mastery = Math.min(100, Math.max(0, revision.masteryPercent));

  return (
    <LinearGradient
      colors={[withAlpha(colors.green, 0.55), withAlpha(colors.violet, 0.45)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: radii.lg, padding: 1 }}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.lg - 1,
          padding: 18,
        }}
      >
        <Text style={[typography.labelSmall, { color: colors.greenSoft }]}>
          RÉVISION DU JOUR
        </Text>

        <Text style={[typography.titleLarge, { marginTop: 8 }]}>{revision.notion}</Text>

        <Text
          style={[typography.labelMedium, { color: colors.textSecondary, marginTop: 4 }]}
        >
          {subject.label} · {revision.lastSeenLabel}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}>
          <View
            style={{
              flex: 1,
              height: 6,
              borderRadius: 999,
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={gradients.success}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 6, width: `${mastery}%`, borderRadius: 999 }}
            />
          </View>
          <Text style={[typography.labelSmall, { color: colors.greenSoft, marginLeft: 10 }]}>
            {mastery} % maîtrisé
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onOpenProgress}
          hitSlop={8}
          style={{ paddingVertical: 8 }}
        >
          <Text style={[typography.label, { color: colors.greenSoft }]}>
            Reprendre mes révisions
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}
