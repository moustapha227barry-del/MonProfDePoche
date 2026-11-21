import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { GradientButton } from "@/components/GradientButton";
import { SectionHeader } from "@/components/SectionHeader";
import type { Recording } from "@/domain/course";
import { getSubject } from "@/domain/subject";
import {
  MAX_BASKET_SIZE,
  basketCounterLabel,
  basketSelectionSummary,
  prepareAnalysisBatch,
  sameSelection,
  sumDurationMs,
  toggleBasketSelection,
  type PreparedAnalysisBatch,
} from "@/lib/basket";
import { withAlpha } from "@/lib/color";
import { formatRecordingDate, formatRecordingDuration } from "@/lib/recording";
import { analysisBatchRepository } from "@/services/storage/analysisBatchRepository";
import { recordingRepository } from "@/services/storage/recordingRepository";
import { colors, gradients, radii, typography } from "@/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

/**
 * Panier d'analyse.
 *
 * Source de vérité : `recordings.json` du dossier documents, via
 * `recordingRepository`. La sélection n'est pas un état d'écran : elle est
 * relue depuis `addedToBasketAt`, ce qui la fait survivre à la fermeture de
 * l'application. Retirer un cours du panier n'efface que cette date : le
 * fichier `.m4a` reste intact.
 *
 * « Préparer l'analyse » valide le lot (1 à 5 fichiers présents) et
 * l'enregistre dans `prepared-analysis.json`. Aucune IA n'est appelée ici.
 */
export function BasketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [missingIds, setMissingIds] = useState<string[]>([]);
  const [batch, setBatch] = useState<PreparedAnalysisBatch | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [items, prepared] = await Promise.all([
        recordingRepository.list(),
        analysisBatchRepository.get(),
      ]);
      setRecordings(items);
      setMissingIds(recordingRepository.missingIds(items));
      setBatch(prepared);
      setError(null);
    } catch (cause) {
      console.warn("[panier] lecture impossible", cause);
      setError(
        "Le panier n’a pas pu être relu depuis le téléphone. Reviens sur l’onglet pour réessayer.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Relecture à chaque arrivée sur l'onglet : un cours enregistré entre-temps
  // apparaît immédiatement, sans redémarrer l'application.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const selected = useMemo(
    () =>
      recordings
        .filter((item) => item.addedToBasketAt)
        .sort((a, b) => (a.addedToBasketAt ?? "").localeCompare(b.addedToBasketAt ?? "")),
    [recordings],
  );
  const selectedIds = useMemo(() => selected.map((item) => item.id), [selected]);
  const available = useMemo(
    () => recordings.filter((item) => !item.addedToBasketAt),
    [recordings],
  );
  const missingSelected = useMemo(
    () => selected.filter((item) => missingIds.includes(item.id)),
    [missingIds, selected],
  );
  const totalDurationMs = useMemo(() => sumDurationMs(selected), [selected]);
  const count = selected.length;
  const full = count >= MAX_BASKET_SIZE;

  const batchIsCurrent = useMemo(() => {
    if (!batch) return false;
    return sameSelection(
      batch.files.map((file) => file.recordingId),
      selectedIds,
    );
  }, [batch, selectedIds]);

  const toggle = useCallback(
    async (recording: Recording) => {
      if (busy) return;

      const result = toggleBasketSelection(selectedIds, recording.id);
      if (result.rejected) {
        setNotice(
          `Le panier est complet : ${MAX_BASKET_SIZE} fichiers maximum par analyse. ` +
            `Retire un fichier pour ajouter « ${recording.title} ».`,
        );
        return;
      }

      setBusy(true);
      setNotice(null);
      try {
        if (selectedIds.includes(recording.id)) {
          await recordingRepository.removeFromBasket([recording.id]);
        } else {
          await recordingRepository.addToBasket([recording.id]);
        }
        // La sélection a changé : un lot préparé avant ne la décrit plus.
        if (batch) await analysisBatchRepository.clear();
        await refresh();
      } catch (cause) {
        console.warn("[panier] sélection non enregistrée", cause);
        setError(
          "La sélection n’a pas pu être enregistrée sur le téléphone. Réessaie dans un instant.",
        );
      } finally {
        setBusy(false);
      }
    },
    [batch, busy, refresh, selectedIds],
  );

  const prepare = useCallback(async () => {
    if (preparing || selected.length === 0) return;
    setPreparing(true);
    setNotice(null);
    setError(null);
    try {
      const result = prepareAnalysisBatch(selected, { missingIds });
      if (!result.ok) {
        setNotice(result.message);
        return;
      }
      await analysisBatchRepository.save(result.batch);
      setBatch(result.batch);
    } catch (cause) {
      console.warn("[panier] préparation impossible", cause);
      setError(
        "Le lot n’a pas pu être préparé. Vérifie l’espace libre du téléphone, puis réessaie.",
      );
    } finally {
      setPreparing(false);
    }
  }, [missingIds, preparing, selected]);

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
      <BasketHeader />
      <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: -6 }]}>
        Réunis jusqu’à 5 enregistrements, vérifie-les, puis prépare le lot pour
        l’analyse.
      </Text>

      <CounterCard count={count} totalDurationMs={totalDurationMs} />

      {notice ? (
        <NoticeCard tone="amber" message={notice} onDismiss={() => setNotice(null)} />
      ) : null}
      {error ? (
        <NoticeCard tone="coral" message={error} onDismiss={() => setError(null)} />
      ) : null}
      {missingSelected.length > 0 ? (
        <MissingFilesCard count={missingSelected.length} />
      ) : null}
      {batchIsCurrent && batch ? <BatchReadyCard batch={batch} /> : null}

      {loading ? (
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <ActivityIndicator color={colors.violetSoft} />
            <Text style={[typography.bodySmall, { flex: 1 }]}>Lecture du panier…</Text>
          </View>
        </Card>
      ) : recordings.length === 0 ? (
        <EmptyBasket onCreate={() => router.push("/recording")} />
      ) : (
        <>
          {count === 0 ? <EmptySelectionCard /> : null}

          {count > 0 ? (
            <View style={{ gap: 10 }}>
              <SectionHeader title="Dans le panier" actionLabel={basketCounterLabel(count)} />
              {selected.map((recording) => (
                <BasketRow
                  key={recording.id}
                  recording={recording}
                  selected
                  missing={missingIds.includes(recording.id)}
                  disabled={busy}
                  onToggle={() => void toggle(recording)}
                />
              ))}
            </View>
          ) : null}

          <View style={{ gap: 10, marginTop: 4 }}>
            <SectionHeader
              title="Enregistrements disponibles"
              actionLabel={full ? "Panier complet" : undefined}
            />
            {available.length === 0 ? (
              <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                Tous tes enregistrements sont déjà dans le panier.
              </Text>
            ) : (
              available.map((recording) => (
                <BasketRow
                  key={recording.id}
                  recording={recording}
                  selected={false}
                  missing={missingIds.includes(recording.id)}
                  disabled={busy}
                  onToggle={() => void toggle(recording)}
                />
              ))
            )}
            {full ? (
              <Text style={[typography.labelSmall, { color: colors.amber }]}>
                {MAX_BASKET_SIZE} fichiers maximum : touche un enregistrement pour
                voir le rappel, ou retire-en un du panier.
              </Text>
            ) : null}
          </View>
        </>
      )}

      {count > 0 ? (
        preparing ? (
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <ActivityIndicator color={colors.greenSoft} />
              <Text style={[typography.bodySmall, { flex: 1 }]}>
                Vérification des fichiers et préparation du lot…
              </Text>
            </View>
          </Card>
        ) : (
          <>
            <GradientButton
              text="Préparer l’analyse"
              icon="sparkles"
              onPress={() => void prepare()}
            />
            {batchIsCurrent && batch ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Analyser le lot préparé"
                onPress={() => router.push("/analysis")}
                style={({ pressed }) => ({
                  height: 54,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: withAlpha(colors.green, 0.45),
                  backgroundColor: withAlpha(colors.green, 0.12),
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ionicons name="sparkles" size={18} color={colors.greenSoft} />
                <Text style={[typography.title, { color: colors.greenSoft }]}>
                  Analyser le lot
                </Text>
              </Pressable>
            ) : null}
          </>
        )
      ) : null}

      <Text
        style={[
          typography.labelSmall,
          { textAlign: "center", color: colors.textMuted, marginTop: 4 },
        ]}
      >
        Le panier ne supprime jamais un fichier audio : retirer un cours le rend
        simplement disponible pour une autre analyse.
      </Text>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// En-tête et compteur
// ---------------------------------------------------------------------------

function BasketHeader() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 8 }}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.labelMedium, { color: colors.violetSoft }]}>
          AVANT L’ANALYSE
        </Text>
        <Text style={[typography.heading, { marginTop: 2 }]}>Mon panier</Text>
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
        <Ionicons name="layers" size={22} color="#FFFFFF" />
      </LinearGradient>
    </View>
  );
}

function CounterCard({
  count,
  totalDurationMs,
}: {
  count: number;
  totalDurationMs: number;
}) {
  const ratio = Math.min(1, Math.max(0, count / MAX_BASKET_SIZE));

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={typography.title}>Sélection pour analyse</Text>
          <Text style={[typography.labelSmall, { color: colors.textMuted }]}>
            {MAX_BASKET_SIZE} fichiers maximum
          </Text>
        </View>
        <Text
          accessibilityLabel={`${count} fichier${count > 1 ? "s" : ""} sélectionné${
            count > 1 ? "s" : ""
          } sur ${MAX_BASKET_SIZE}`}
          style={{
            fontSize: 32,
            lineHeight: 36,
            fontWeight: "700",
            letterSpacing: -0.8,
            fontVariant: ["tabular-nums"],
            color: count > 0 ? colors.violetSoft : colors.textMuted,
          }}
        >
          {basketCounterLabel(count)}
        </Text>
      </View>

      <View
        style={{
          height: 8,
          borderRadius: 999,
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={gradients.record}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 8, width: `${ratio * 100}%`, borderRadius: 999 }}
        />
      </View>

      <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
        {basketSelectionSummary(count)}
        {count > 0 ? ` · ${formatRecordingDuration(totalDurationMs)}` : ""}
      </Text>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

function NoticeCard({
  message,
  tone,
  onDismiss,
}: {
  message: string;
  tone: "amber" | "coral";
  onDismiss: () => void;
}) {
  const accent = tone === "amber" ? colors.amber : colors.coral;

  return (
    <Card borderColor={withAlpha(accent, 0.45)}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Ionicons
          name={tone === "amber" ? "information-circle" : "alert-circle"}
          size={20}
          color={accent}
        />
        <Text style={[typography.bodySmall, { flex: 1, color: colors.textPrimary }]}>
          {message}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer le message"
          onPress={onDismiss}
          hitSlop={10}
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    </Card>
  );
}

function MissingFilesCard({ count }: { count: number }) {
  return (
    <Card borderColor={withAlpha(colors.coral, 0.4)}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Ionicons name="alert-circle" size={20} color={colors.coral} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={typography.title}>Fichier introuvable</Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            {count === 1
              ? "1 fichier du panier n’existe plus sur le téléphone."
              : `${count} fichiers du panier n’existent plus sur le téléphone.`}{" "}
            Retire-le{count > 1 ? "s" : ""} du panier pour pouvoir préparer
            l’analyse. Aucun fichier audio n’est supprimé par le panier.
          </Text>
        </View>
      </View>
    </Card>
  );
}

function BatchReadyCard({ batch }: { batch: PreparedAnalysisBatch }) {
  return (
    <LinearGradient
      colors={[withAlpha(colors.green, 0.5), withAlpha(colors.violet, 0.35)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: radii.lg, padding: 1 }}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.lg - 1,
          padding: 16,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="shield-checkmark" size={20} color={colors.green} />
          <Text style={[typography.title, { flex: 1 }]}>Lot prêt pour l’analyse</Text>
          <View
            style={{
              borderRadius: 999,
              paddingHorizontal: 9,
              paddingVertical: 4,
              backgroundColor: withAlpha(colors.green, 0.14),
            }}
          >
            <Text style={[typography.labelSmall, { color: colors.greenSoft }]}>VALIDÉ</Text>
          </View>
        </View>

        <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>
          {batch.files.length} fichier{batch.files.length > 1 ? "s" : ""} ·{" "}
          {formatRecordingDuration(batch.totalDurationMs)} ·{" "}
          {formatRecordingDate(batch.createdAt)}
        </Text>

        {batch.files.map((file) => (
          <Text
            key={file.recordingId}
            numberOfLines={1}
            style={[typography.labelSmall, { color: colors.textSecondary }]}
          >
            • {file.title} — {file.fileName}
          </Text>
        ))}

        <Text style={[typography.labelSmall, { color: colors.blueSoft, marginTop: 2 }]}>
          Aucune analyse n’a été lancée : le lot est enregistré sur le téléphone,
          prêt pour le moteur IA de l’étape suivante.
        </Text>
      </View>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// États vides
// ---------------------------------------------------------------------------

function EmptyBasket({ onCreate }: { onCreate: () => void }) {
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
          <Ionicons name="mic" size={26} color="#FFFFFF" />
        </LinearGradient>
        <Text style={[typography.titleLarge, { textAlign: "center", marginTop: 4 }]}>
          Ton panier est vide
        </Text>
        <Text
          style={[
            typography.bodySmall,
            { textAlign: "center", color: colors.textSecondary },
          ]}
        >
          Enregistre un cours, puis reviens ici pour le sélectionner avant
          l’analyse.
        </Text>
      </Card>
      <GradientButton text="Enregistrer un cours" icon="mic" onPress={onCreate} />
    </View>
  );
}

function EmptySelectionCard() {
  return (
    <Card borderColor={withAlpha(colors.blue, 0.35)}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Ionicons name="layers-outline" size={20} color={colors.blueSoft} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={typography.title}>Choisis tes cours</Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            Sélectionne un ou plusieurs enregistrements ci-dessous, puis prépare
            le lot. Tu pourras en choisir {MAX_BASKET_SIZE} au maximum.
          </Text>
        </View>
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Ligne d'enregistrement
// ---------------------------------------------------------------------------

function BasketRow({
  recording,
  selected,
  missing,
  disabled,
  onToggle,
}: {
  recording: Recording;
  selected: boolean;
  missing: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const subject = getSubject(recording.subject);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={`${recording.title}, ${subject.label}, ${formatRecordingDuration(
        recording.durationMs,
      )}`}
      disabled={disabled}
      onPress={onToggle}
      style={({ pressed }) => ({
        opacity: pressed ? 0.86 : disabled ? 0.6 : 1,
      })}
    >
      <Card
        padding={14}
        borderColor={
          selected
            ? withAlpha(colors.violet, 0.45)
            : missing
              ? withAlpha(colors.coral, 0.4)
              : undefined
        }
        backgroundColor={selected ? withAlpha(colors.violet, 0.1) : undefined}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 13,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: withAlpha(subject.accent, 0.16),
            }}
          >
            <Ionicons name="mic" size={18} color={subject.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={typography.title}>
              {recording.title}
            </Text>
            <Text numberOfLines={1} style={[typography.labelSmall, { marginTop: 4 }]}>
              {subject.label} · {formatRecordingDuration(recording.durationMs)} ·{" "}
              {formatRecordingDate(recording.createdAt)}
            </Text>
            {missing ? (
              <Text style={[typography.labelSmall, { color: colors.coral, marginTop: 4 }]}>
                Fichier introuvable sur le téléphone
              </Text>
            ) : null}
          </View>

          {selected ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Retirer ${recording.title} du panier`}
              disabled={disabled}
              onPress={onToggle}
              hitSlop={8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 9,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: withAlpha(colors.violet, 0.16),
              }}
            >
              <Ionicons name="remove-circle-outline" size={15} color={colors.violetSoft} />
              <Text style={[typography.labelSmall, { color: colors.violetSoft }]}>
                Retirer
              </Text>
            </Pressable>
          ) : (
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 9,
                borderWidth: 1.5,
                borderColor: missing ? withAlpha(colors.coral, 0.6) : colors.border,
                backgroundColor: colors.inkElevated,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={16} color={colors.textMuted} />
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}
