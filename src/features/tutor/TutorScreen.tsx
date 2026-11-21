import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import type { Course } from "@/domain/course";
import { getSubject } from "@/domain/subject";
import { backendBaseUrl, describeAiError } from "@/lib/ai";
import { withAlpha } from "@/lib/color";
import { createHttpTutorService } from "@/services/ai/httpTutorService";
import { courseRepository } from "@/services/storage/local";
import { colors, radii, typography } from "@/theme";

type ChatEntry = {
  id: string;
  role: "student" | "tutor";
  content: string;
  citations?: string[];
  grounded?: boolean;
  hint?: string;
};

/**
 * Tuteur IA appuyé sur les cours de l'élève.
 *
 * Le cours choisi sert de contexte au backend. Les citations renvoyées sont
 * vérifiées côté client ; une réponse sans appui est signalée explicitement.
 * Sans backend configuré, l'écran le dit et ne fabrique aucune réponse.
 */
export function TutorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backend = useMemo(() => backendBaseUrl(), []);
  const service = useMemo(() => createHttpTutorService(), []);
  const course = courses.find((item) => item.id === courseId) ?? null;

  const refresh = useCallback(async () => {
    try {
      const list = await courseRepository.list();
      setCourses(list);
      setCourseId((current) => current ?? list[0]?.id ?? null);
    } catch (cause) {
      console.warn("[tuteur] cours illisibles", cause);
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

  const selectCourse = useCallback((id: string) => {
    setCourseId(id);
    setEntries([]);
    setError(null);
  }, []);

  const send = useCallback(async () => {
    const text = question.trim();
    if (!text || !course || sending) return;

    const history = entries.map((entry) => ({ role: entry.role, content: entry.content }));
    setEntries((current) => [
      ...current,
      { id: `student-${Date.now()}`, role: "student", content: text },
    ]);
    setQuestion("");
    setSending(true);
    setError(null);

    try {
      const reply = await service.ask({ question: text, course, history });
      setEntries((current) => [
        ...current,
        {
          id: `${reply.message.id}-${current.length}`,
          role: "tutor",
          content: reply.message.content,
          citations: reply.citations,
          grounded: reply.grounded,
          hint: reply.hint,
        },
      ]);
    } catch (cause) {
      console.warn("[tuteur] réponse impossible", cause);
      setError(describeAiError(cause));
    } finally {
      setSending(false);
    }
  }, [course, entries, question, sending, service]);

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
      <View style={{ paddingTop: 8 }}>
        <Text style={[typography.labelMedium, { color: colors.violetSoft }]}>
          APPUYÉ SUR TES COURS
        </Text>
        <Text style={[typography.heading, { marginTop: 2 }]}>Tuteur IA</Text>
      </View>

      {loading ? (
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <ActivityIndicator color={colors.violetSoft} />
            <Text style={[typography.bodySmall, { flex: 1 }]}>Chargement de tes cours…</Text>
          </View>
        </Card>
      ) : courses.length === 0 ? (
        <View style={{ gap: 14 }}>
          <Card style={{ alignItems: "center", gap: 10, paddingVertical: 28 }} padding={20}>
            <Ionicons name="chatbubble-ellipses" size={34} color={colors.violetSoft} />
            <Text style={[typography.titleLarge, { textAlign: "center" }]}>
              Le tuteur a besoin d’un cours
            </Text>
            <Text
              style={[
                typography.bodySmall,
                { textAlign: "center", color: colors.textSecondary },
              ]}
            >
              Analyse d’abord un enregistrement : le tuteur répondra à partir de ton cours,
              pas de connaissances inventées.
            </Text>
          </Card>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvrir le panier"
            onPress={() => router.navigate("/basket")}
            style={{
              height: 54,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: withAlpha(colors.violet, 0.45),
              backgroundColor: withAlpha(colors.violet, 0.12),
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
            }}
          >
            <Ionicons name="layers" size={18} color={colors.violetSoft} />
            <Text style={[typography.title, { color: colors.violetSoft }]}>Ouvrir le panier</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {courses.map((item) => {
              const subject = getSubject(item.subject);
              const selected = item.id === courseId;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Choisir le cours ${item.title}`}
                  onPress={() => selectCourse(item.id)}
                  style={{
                    maxWidth: 220,
                    borderRadius: 999,
                    paddingHorizontal: 13,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: selected ? withAlpha(subject.accent, 0.6) : colors.border,
                    backgroundColor: selected
                      ? withAlpha(subject.accent, 0.16)
                      : colors.surface,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      typography.labelMedium,
                      { color: selected ? colors.textPrimary : colors.textSecondary },
                    ]}
                  >
                    {item.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {!backend ? (
            <Card borderColor={withAlpha(colors.amber, 0.4)}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Ionicons name="cloud-offline" size={20} color={colors.amber} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={typography.title}>Service IA non configuré</Text>
                  <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                    Renseigne EXPO_PUBLIC_API_URL avec l’adresse du backend sécurisé
                    (dossier backend/). Le tuteur n’inventera pas de réponse en attendant.
                  </Text>
                </View>
              </View>
            </Card>
          ) : null}

          <Card style={{ gap: 10 }}>
            <Text style={typography.title}>{course?.title}</Text>
            <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
              {course ? getSubject(course.subject).label : ""} ·{" "}
              {course?.chapters.length ?? 0} chapitres. Le tuteur cite les notions qu’il
              utilise.
            </Text>

            {entries.length === 0 ? (
              <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 4 }]}>
                Pose ta première question : « Explique-moi la notion de dérivée », « Donne-moi
                un exemple », « Pourquoi cette formule ? »
              </Text>
            ) : null}

            {entries.map((entry) =>
              entry.role === "student" ? (
                <View
                  key={entry.id}
                  style={{
                    alignSelf: "flex-end",
                    maxWidth: "88%",
                    borderRadius: 16,
                    borderBottomRightRadius: 4,
                    paddingHorizontal: 13,
                    paddingVertical: 9,
                    backgroundColor: withAlpha(colors.violet, 0.24),
                  }}
                >
                  <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>
                    {entry.content}
                  </Text>
                </View>
              ) : (
                <View
                  key={entry.id}
                  style={{
                    alignSelf: "flex-start",
                    maxWidth: "92%",
                    borderRadius: 16,
                    borderBottomLeftRadius: 4,
                    paddingHorizontal: 13,
                    paddingVertical: 10,
                    backgroundColor: colors.surfaceHigh,
                    gap: 6,
                  }}
                >
                  <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>
                    {entry.content}
                  </Text>

                  {entry.hint ? (
                    <Text style={[typography.labelSmall, { color: colors.blueSoft }]}>
                      Indice : {entry.hint}
                    </Text>
                  ) : null}

                  {entry.citations && entry.citations.length > 0 ? (
                    <Text style={[typography.labelSmall, { color: colors.violetSoft }]}>
                      D’après : {entry.citations.join(" · ")}
                    </Text>
                  ) : null}

                  {entry.grounded === false ? (
                    <Text style={[typography.labelSmall, { color: colors.amber }]}>
                      Réponse non appuyée sur ton cours : à vérifier.
                    </Text>
                  ) : null}
                </View>
              ),
            )}

            {sending ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator color={colors.violetSoft} />
                <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
                  Le tuteur réfléchit…
                </Text>
              </View>
            ) : null}

            {error ? (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Ionicons name="alert-circle" size={18} color={colors.coral} />
                <Text style={[typography.bodySmall, { flex: 1, color: colors.coral }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 8,
                marginTop: 6,
              }}
            >
              <TextInput
                value={question}
                onChangeText={setQuestion}
                editable={Boolean(backend) && !sending}
                placeholder={
                  backend ? "Pose ta question…" : "Service IA non configuré"
                }
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={1000}
                style={{
                  flex: 1,
                  minHeight: 46,
                  maxHeight: 120,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.inkElevated,
                  paddingHorizontal: 13,
                  paddingVertical: 10,
                  color: colors.textPrimary,
                  fontSize: 15,
                  opacity: backend ? 1 : 0.5,
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Envoyer la question"
                accessibilityState={{ disabled: !backend || sending || !question.trim() }}
                disabled={!backend || sending || !question.trim()}
                onPress={() => void send()}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: withAlpha(colors.violet, 0.2),
                  borderWidth: 1,
                  borderColor: withAlpha(colors.violet, 0.45),
                  opacity: !backend || sending || !question.trim() ? 0.45 : 1,
                }}
              >
                <Ionicons name="send" size={18} color={colors.violetSoft} />
              </Pressable>
            </View>
          </Card>

          <Text style={[typography.labelSmall, { textAlign: "center", color: colors.textMuted }]}>
            Le tuteur s’appuie sur le cours sélectionné. S’il ne trouve pas l’information, il
            le dit au lieu de l’inventer.
          </Text>
        </>
      )}
    </ScrollView>
  );
}
