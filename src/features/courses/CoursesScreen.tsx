import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { GradientButton } from "@/components/GradientButton";
import type { Course } from "@/domain/course";
import { SUBJECTS, getSubject, type SubjectId } from "@/domain/subject";
import { withAlpha } from "@/lib/color";
import { courseStats, searchCourses } from "@/lib/course";
import { formatRecordingDate } from "@/lib/recording";
import { courseRepository } from "@/services/storage/local";
import { colors, gradients, radii, typography } from "@/theme";

/**
 * Liste des cours réellement analysés. Aucune donnée de démonstration : tant
 * qu'aucune analyse n'a réussi, l'écran propose d'ouvrir le panier.
 */
export function CoursesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<SubjectId | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setCourses(await courseRepository.list());
      setError(null);
    } catch (cause) {
      console.warn("[cours] lecture impossible", cause);
      setError("Les cours n’ont pas pu être relus depuis le téléphone.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const filtered = useMemo(
    () => searchCourses(courses, query, subject),
    [courses, query, subject],
  );
  const subjectsWithCourses = useMemo(
    () => SUBJECTS.filter((item) => courses.some((course) => course.subject === item.id)),
    [courses],
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.ink }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 8,
        paddingBottom: 120,
        gap: 16,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.labelMedium, { color: colors.blueSoft }]}>
            {courses.length} cours enregistré{courses.length > 1 ? "s" : ""}
          </Text>
          <Text style={[typography.heading, { marginTop: 2 }]}>Mes cours</Text>
        </View>
        <LinearGradient
          colors={gradients.record}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="book" size={22} color="#FFFFFF" />
        </LinearGradient>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          height: 50,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: 14,
        }}
      >
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un chapitre, une notion…"
          placeholderTextColor={colors.textMuted}
          style={{ flex: 1, color: colors.textPrimary, fontSize: 15 }}
          returnKeyType="search"
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Effacer la recherche"
            onPress={() => setQuery("")}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {subjectsWithCourses.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          <FilterChip
            label="Toutes"
            accent={colors.violetSoft}
            selected={subject === "all"}
            onPress={() => setSubject("all")}
          />
          {subjectsWithCourses.map((item) => (
            <FilterChip
              key={item.id}
              label={item.label}
              accent={item.accent}
              selected={subject === item.id}
              onPress={() => setSubject(item.id)}
            />
          ))}
        </ScrollView>
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
            <Text style={[typography.bodySmall, { flex: 1 }]}>Chargement des cours…</Text>
          </View>
        </Card>
      ) : courses.length === 0 ? (
        <EmptyCourses onCreate={() => router.navigate("/basket")} />
      ) : filtered.length === 0 ? (
        <Card>
          <Text style={typography.title}>Aucun résultat</Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 6 }]}>
            Aucun cours ne correspond à « {query} ». Essaie un autre mot ou retire le filtre
            de matière.
          </Text>
        </Card>
      ) : (
        filtered.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onOpen={() => router.push(`/course/${course.id}`)}
          />
        ))
      )}
    </ScrollView>
  );
}

function FilterChip({
  label,
  accent,
  selected,
  onPress,
}: {
  label: string;
  accent: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Filtrer : ${label}`}
      onPress={onPress}
      style={{
        borderRadius: 999,
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: selected ? withAlpha(accent, 0.6) : colors.border,
        backgroundColor: selected ? withAlpha(accent, 0.16) : colors.surface,
      }}
    >
      <Text
        style={[
          typography.labelMedium,
          { color: selected ? colors.textPrimary : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CourseCard({ course, onOpen }: { course: Course; onOpen: () => void }) {
  const subject = getSubject(course.subject);
  const stats = courseStats(course);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir le cours ${course.title}`}
      onPress={onOpen}
      style={({ pressed }) => ({ opacity: pressed ? 0.86 : 1 })}
    >
      <Card padding={16}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
            <Ionicons name="book" size={20} color={subject.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text numberOfLines={2} style={typography.title}>
              {course.title}
            </Text>
            <Text numberOfLines={1} style={[typography.labelSmall, { marginTop: 4 }]}>
              {subject.label} · {stats.chapters} chapitre{stats.chapters > 1 ? "s" : ""} ·{" "}
              {stats.notions} notion{stats.notions > 1 ? "s" : ""}
            </Text>
            <Text style={[typography.labelSmall, { marginTop: 2 }]}>
              {formatRecordingDate(course.updatedAt)}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 }}>
          <View
            style={{
              flex: 1,
              height: 6,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 6,
                width: `${stats.masteryPercent}%`,
                borderRadius: 999,
                backgroundColor: stats.masteryPercent >= 70 ? colors.green : colors.violetSoft,
              }}
            />
          </View>
          <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
            {stats.masteryPercent} % maîtrisé
          </Text>
        </View>

        {course.uncertainties.length > 0 ? (
          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              alignSelf: "flex-start",
              paddingHorizontal: 9,
              paddingVertical: 4,
              backgroundColor: withAlpha(colors.amber, 0.13),
            }}
          >
            <Ionicons name="alert-circle" size={13} color={colors.amber} />
            <Text style={[typography.labelSmall, { color: colors.amber }]}>
              {course.uncertainties.length} passage
              {course.uncertainties.length > 1 ? "s" : ""} incertain
              {course.uncertainties.length > 1 ? "s" : ""}
            </Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

function EmptyCourses({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={{ gap: 14 }}>
      <Card style={{ alignItems: "center", gap: 10, paddingVertical: 28 }} padding={20}>
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="sparkles" size={26} color="#FFFFFF" />
        </LinearGradient>
        <Text style={[typography.titleLarge, { textAlign: "center", marginTop: 4 }]}>
          Aucun cours analysé
        </Text>
        <Text
          style={[
            typography.bodySmall,
            { textAlign: "center", color: colors.textSecondary },
          ]}
        >
          Enregistre un cours, prépare un lot dans le panier, puis lance l’analyse :
          le cours structuré apparaîtra ici.
        </Text>
      </Card>
      <GradientButton text="Ouvrir le panier" icon="layers" onPress={onCreate} />
    </View>
  );
}
