import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import type { Chapter, Course, Notion, Recording } from "@/domain/course";
import { getSubject } from "@/domain/subject";
import { withAlpha } from "@/lib/color";
import { courseStats } from "@/lib/course";
import { formatRecordingDate, formatRecordingDuration } from "@/lib/recording";
import { courseRepository, recordingRepository } from "@/services/storage/local";
import { colors, radii, typography } from "@/theme";

/**
 * Détail d'un cours analysé : chapitres, sections, notions et incertitudes,
 * avec le lien vers les enregistrements d'origine. Le cours peut être renommé
 * ou supprimé ; ses fichiers audio ne sont jamais supprimés ici.
 */
export function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [course, setCourse] = useState<Course | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [found, allRecordings] = await Promise.all([
        courseRepository.get(id),
        recordingRepository.list(),
      ]);
      setCourse(found);
      setRecordings(allRecordings);
      setExpanded((current) => current ?? found?.chapters[0]?.id ?? null);
      if (!found) setError("Ce cours n’existe plus sur le téléphone.");
      else setError(null);
    } catch (cause) {
      console.warn("[cours] détail illisible", cause);
      setError("Le cours n’a pas pu être relu depuis le téléphone.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => (course ? courseStats(course) : null), [course]);
  const sources = useMemo(
    () => (course ? recordings.filter((item) => course.recordingIds.includes(item.id)) : []),
    [course, recordings],
  );
  const missingSources = course ? course.recordingIds.length - sources.length : 0;

  const saveTitle = useCallback(async () => {
    if (!course || busy) return;
    setBusy(true);
    try {
      const updated = await courseRepository.rename(course.id, draft);
      if (!updated) {
        setError("Le titre ne peut pas être vide.");
        return;
      }
      setCourse(updated);
      setEditing(false);
    } catch (cause) {
      console.warn("[cours] renommage impossible", cause);
      setError("Le titre n’a pas pu être enregistré.");
    } finally {
      setBusy(false);
    }
  }, [busy, course, draft]);

  const markStudied = useCallback(
    async (chapterId: string) => {
      if (!course) return;
      try {
        const updated = await courseRepository.markChapterStudied(course.id, chapterId);
        if (updated) setCourse(updated);
      } catch (cause) {
        console.warn("[cours] chapitre non marqué", cause);
        setError("Le chapitre n’a pas pu être marqué comme étudié.");
      }
    },
    [course],
  );

  const setMastery = useCallback(
    async (notionId: string, value: number) => {
      if (!course) return;
      try {
        const updated = await courseRepository.setNotionMastery(course.id, notionId, value);
        if (updated) setCourse(updated);
      } catch (cause) {
        console.warn("[cours] maîtrise non enregistrée", cause);
        setError("La maîtrise n’a pas pu être enregistrée.");
      }
    },
    [course],
  );

  const removeCourse = useCallback(() => {
    if (!course || busy) return;
    Alert.alert(
      "Supprimer ce cours ?",
      `« ${course.title} » sera retiré de l’application. Les fichiers audio d’origine restent sur le téléphone.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await courseRepository.remove(course.id);
              await recordingRepository.detachCourse(course.id);
              router.back();
            } catch (cause) {
              console.warn("[cours] suppression impossible", cause);
              setError("Le cours n’a pas pu être supprimé.");
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }, [busy, course, router]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.ink,
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <ActivityIndicator color={colors.violetSoft} />
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
          Chargement du cours…
        </Text>
      </View>
    );
  }

  const subject = course ? getSubject(course.subject) : null;

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
          accessibilityLabel="Retour aux cours"
          onPress={() => router.back()}
          hitSlop={10}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          <Text style={[typography.label, { color: colors.textSecondary }]}>Mes cours</Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        {course ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Renommer le cours"
              onPress={() => {
                setDraft(course.title);
                setEditing(true);
              }}
              hitSlop={10}
              style={{ padding: 6 }}
            >
              <Ionicons name="pencil" size={18} color={colors.violetSoft} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Supprimer le cours"
              onPress={removeCourse}
              hitSlop={10}
              style={{ padding: 6 }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.coral} />
            </Pressable>
          </>
        ) : null}
      </View>

      {!course ? (
        <Card borderColor={withAlpha(colors.coral, 0.4)}>
          <Text style={typography.title}>Cours introuvable</Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 6 }]}>
            {error ?? "Ce cours a peut-être été supprimé."}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={{ paddingVertical: 10 }}
          >
            <Text style={[typography.label, { color: colors.violetSoft }]}>Revenir aux cours</Text>
          </Pressable>
        </Card>
      ) : (
        <>
          {editing ? (
            <View style={{ gap: 8 }}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                autoFocus
                maxLength={120}
                placeholder="Titre du cours"
                placeholderTextColor={colors.textMuted}
                style={{
                  height: 50,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: withAlpha(colors.violet, 0.5),
                  backgroundColor: colors.surface,
                  paddingHorizontal: 14,
                  color: colors.textPrimary,
                  fontSize: 17,
                }}
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <ActionPill label="Enregistrer" icon="checkmark" tone={colors.greenSoft} onPress={() => void saveTitle()} />
                <ActionPill label="Annuler" icon="close" tone={colors.textSecondary} onPress={() => setEditing(false)} />
              </View>
            </View>
          ) : (
            <Text style={typography.headline}>{course.title}</Text>
          )}

          {subject ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <MetaChip icon="book" label={subject.label} accent={subject.accent} />
              <MetaChip icon="list" label={`${stats?.chapters ?? 0} chapitres`} accent={colors.blueSoft} />
              <MetaChip icon="bulb" label={`${stats?.notions ?? 0} notions`} accent={colors.violetSoft} />
            </View>
          ) : null}

          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[typography.label, { flex: 1 }]}>Maîtrise du cours</Text>
              <Text style={[typography.title, { color: colors.greenSoft }]}>
                {stats?.masteryPercent ?? 0} %
              </Text>
            </View>
            <View
              style={{
                height: 8,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 8,
                  width: `${stats?.masteryPercent ?? 0}%`,
                  borderRadius: 999,
                  backgroundColor: colors.green,
                }}
              />
            </View>
            <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
              {stats?.studiedChapters ?? 0} chapitre{(stats?.studiedChapters ?? 0) > 1 ? "s" : ""} étudié
              {(stats?.studiedChapters ?? 0) > 1 ? "s" : ""} sur {stats?.chapters ?? 0}. La maîtrise
              se règle sur chaque notion et se met à jour avec tes exercices.
            </Text>
          </Card>

          {course.uncertainties.length > 0 ? (
            <Card borderColor={withAlpha(colors.amber, 0.4)}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="alert-circle" size={18} color={colors.amber} />
                <Text style={typography.title}>Passages incertains</Text>
              </View>
              <Text style={[typography.labelSmall, { color: colors.textSecondary, marginTop: 6 }]}>
                L’IA n’a pas pu confirmer ces points : ils n’ont pas été complétés par des
                suppositions.
              </Text>
              {course.uncertainties.map((uncertainty, index) => (
                <Text
                  key={`${index}-${uncertainty.slice(0, 12)}`}
                  style={[typography.bodySmall, { color: colors.textPrimary, marginTop: 6 }]}
                >
                  • {uncertainty}
                </Text>
              ))}
            </Card>
          ) : null}

          {course.transcript ? (
            <Card style={{ gap: 8 }}>
              <Text style={typography.title}>Transcription</Text>
              <Text
                numberOfLines={showTranscript ? undefined : 6}
                style={[typography.bodySmall, { color: colors.textSecondary }]}
              >
                {course.transcript}
              </Text>
              {course.transcript.length > 300 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowTranscript((value) => !value)}
                  style={{ paddingVertical: 6 }}
                >
                  <Text style={[typography.label, { color: colors.violetSoft }]}>
                    {showTranscript ? "Réduire" : "Tout afficher"}
                  </Text>
                </Pressable>
              ) : null}
            </Card>
          ) : null}

          <Card>
            <Text style={typography.title}>Enregistrements d’origine</Text>
            {sources.map((recording) => (
              <Text
                key={recording.id}
                style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 6 }]}
              >
                • {recording.title} · {formatRecordingDuration(recording.durationMs)} ·{" "}
                {formatRecordingDate(recording.createdAt)}
              </Text>
            ))}
            {missingSources > 0 ? (
              <Text style={[typography.labelSmall, { color: colors.amber, marginTop: 6 }]}>
                {missingSources} fichier{missingSources > 1 ? "s" : ""} d’origine n’est plus
                présent sur le téléphone.
              </Text>
            ) : null}
            {course.recordingIds.length === 0 ? (
              <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 6 }]}>
                Aucun enregistrement associé.
              </Text>
            ) : null}
          </Card>

          <Text style={[typography.labelMedium, { color: colors.textSecondary, marginTop: 4 }]}>
            CHAPITRES ET NOTIONS
          </Text>

          {course.chapters.map((chapter, index) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              index={index}
              expanded={expanded === chapter.id}
              onToggle={() => setExpanded(expanded === chapter.id ? null : chapter.id)}
              onStudied={() => void markStudied(chapter.id)}
              onMastery={(notionId, value) => void setMastery(notionId, value)}
            />
          ))}

          {error ? (
            <Card borderColor={withAlpha(colors.coral, 0.4)}>
              <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>{error}</Text>
            </Card>
          ) : null}

          <Text style={[typography.labelSmall, { textAlign: "center", color: colors.textMuted }]}>
            Contenu produit à partir de tes enregistrements. Les passages incertains sont
            signalés, jamais inventés.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

function MetaChip({
  icon,
  label,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accent: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        paddingHorizontal: 11,
        paddingVertical: 6,
        backgroundColor: withAlpha(accent, 0.14),
        borderWidth: 1,
        borderColor: withAlpha(accent, 0.3),
      }}
    >
      <Ionicons name={icon} size={13} color={accent} />
      <Text style={[typography.labelSmall, { color: accent }]}>{label}</Text>
    </View>
  );
}

function ActionPill({
  label,
  icon,
  tone,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: withAlpha(tone, 0.14),
        borderWidth: 1,
        borderColor: withAlpha(tone, 0.35),
      }}
    >
      <Ionicons name={icon} size={14} color={tone} />
      <Text style={[typography.labelSmall, { color: tone }]}>{label}</Text>
    </Pressable>
  );
}

function ChapterCard({
  chapter,
  index,
  expanded,
  onToggle,
  onStudied,
  onMastery,
}: {
  chapter: Chapter;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onStudied: () => void;
  onMastery: (notionId: string, value: number) => void;
}) {
  return (
    <Card padding={16} style={{ gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`Chapitre ${index + 1} : ${chapter.title}`}
        onPress={onToggle}
        style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: withAlpha(colors.violet, 0.16),
          }}
        >
          <Text style={[typography.label, { color: colors.violetSoft }]}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={typography.title}>{chapter.title}</Text>
          {chapter.summary ? (
            <Text
              numberOfLines={expanded ? 3 : 1}
              style={[typography.labelSmall, { marginTop: 3 }]}
            >
              {chapter.summary}
            </Text>
          ) : null}
        </View>
        {chapter.studiedAt ? (
          <Ionicons name="checkmark-circle" size={18} color={colors.green} />
        ) : null}
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>

      {expanded ? (
        <>
          {chapter.sections.map((section) => (
            <View key={section.id} style={{ gap: 4 }}>
              <Text style={[typography.label, { color: colors.blueSoft }]}>{section.title}</Text>
              <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>
                {section.content}
              </Text>
            </View>
          ))}

          {chapter.notions.map((notion) => (
            <NotionCard
              key={notion.id}
              notion={notion}
              onMastery={(value) => onMastery(notion.id, value)}
            />
          ))}

          {chapter.studiedAt ? (
            <Text style={[typography.labelSmall, { color: colors.greenSoft }]}>
              Étudié le {formatRecordingDate(chapter.studiedAt)}
            </Text>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Marquer le chapitre ${chapter.title} comme étudié`}
              onPress={onStudied}
              style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: withAlpha(colors.green, 0.13),
                borderWidth: 1,
                borderColor: withAlpha(colors.green, 0.35),
              }}
            >
              <Ionicons name="checkmark" size={14} color={colors.greenSoft} />
              <Text style={[typography.labelSmall, { color: colors.greenSoft }]}>
                Marquer comme étudié
              </Text>
            </Pressable>
          )}
        </>
      ) : null}
    </Card>
  );
}

function NotionCard({ notion, onMastery }: { notion: Notion; onMastery: (value: number) => void }) {
  const mastery = notion.masteryPercent;

  return (
    <View
      style={{
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.inkElevated,
        padding: 12,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name="bulb" size={15} color={colors.violetSoft} />
        <Text style={[typography.label, { flex: 1 }]}>{notion.title}</Text>
        <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>{mastery} %</Text>
      </View>

      {notion.definition ? (
        <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>
          {notion.definition}
        </Text>
      ) : null}
      {notion.formula ? (
        <Text style={[typography.bodySmall, { color: colors.blueSoft }]}>{notion.formula}</Text>
      ) : null}
      {notion.method ? (
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
          Méthode : {notion.method}
        </Text>
      ) : null}
      {notion.example ? (
        <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
          Exemple : {notion.example}
        </Text>
      ) : null}
      {notion.uncertain ? (
        <Text style={[typography.labelSmall, { color: colors.amber }]}>
          Notion signalée comme incertaine par l’analyse.
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
        <View
          style={{
            flex: 1,
            height: 5,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: 5,
              width: `${mastery}%`,
              borderRadius: 999,
              backgroundColor: mastery >= 70 ? colors.green : colors.amber,
            }}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Marquer ${notion.title} à revoir`}
          onPress={() => onMastery(30)}
          hitSlop={6}
        >
          <Text style={[typography.labelSmall, { color: colors.amber }]}>À revoir</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Marquer ${notion.title} comme comprise`}
          onPress={() => onMastery(85)}
          hitSlop={6}
        >
          <Text style={[typography.labelSmall, { color: colors.greenSoft }]}>Compris</Text>
        </Pressable>
      </View>
    </View>
  );
}
