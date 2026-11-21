import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { GradientButton } from "@/components/GradientButton";
import { SectionHeader } from "@/components/SectionHeader";
import { Waveform } from "@/components/Waveform";
import type { Recording } from "@/domain/course";
import { SUBJECTS, getSubject, type SubjectId } from "@/domain/subject";
import { useRecordingSession } from "@/features/recording/useRecordingSession";
import { withAlpha } from "@/lib/color";
import { formatRecordingTimer } from "@/lib/format";
import {
  formatRecordingDate,
  formatRecordingDuration,
} from "@/lib/recording";
import { recordingRepository } from "@/services/storage/recordingRepository";
import { colors, gradients, radii, typography } from "@/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const PHASE_LABELS: Record<string, string> = {
  idle: "PRÊT À ENREGISTRER",
  starting: "PRÉPARATION…",
  recording: "ENREGISTREMENT EN COURS",
  paused: "EN PAUSE",
  saving: "SAUVEGARDE…",
};

function phaseColor(phase: string): string {
  if (phase === "recording") return colors.coral;
  if (phase === "paused") return colors.amber;
  if (phase === "saving" || phase === "starting") return colors.blueSoft;
  return colors.textMuted;
}

/**
 * Écran d'enregistrement : choix de la matière, titre facultatif, chronomètre
 * réel, onde issue du niveau micro, puis pause / reprise / arrêt.
 *
 * Chaque arrêt produit un fichier `.m4a` autonome et une entrée de métadonnées
 * dans le stockage local. La liste en bas relit ce stockage : elle prouve que
 * les enregistrements sont bien conservés séparément, prêts pour le panier.
 */
export function RecordingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useRecordingSession();

  const [subject, setSubject] = useState<SubjectId>("mathematics");
  const [title, setTitle] = useState("");
  const [savedRecordings, setSavedRecordings] = useState<Recording[]>([]);
  const [lastSaved, setLastSaved] = useState<Recording | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const locked = session.phase !== "idle";

  const refreshSaved = useCallback(async () => {
    try {
      setSavedRecordings(await recordingRepository.list());
    } catch (cause) {
      console.warn("[enregistrement] liste locale illisible", cause);
      setNotice("Les enregistrements sauvegardés n'ont pas pu être relus.");
    }
  }, []);

  useEffect(() => {
    void refreshSaved();
  }, [refreshSaved]);

  const handleStart = useCallback(async () => {
    setNotice(null);
    setLastSaved(null);
    const result = await session.start({ subject, title });
    if (!result.ok) setNotice(result.message);
  }, [session, subject, title]);

  const handleStop = useCallback(async () => {
    const recording = await session.stop();
    if (!recording) {
      setNotice(session.error ?? "L'enregistrement n'a pas pu être sauvegardé.");
      return;
    }
    setTitle("");
    setLastSaved(recording);
    setNotice(null);
    await refreshSaved();
  }, [refreshSaved, session]);

  const leave = useCallback(() => {
    if (!session.isActive) {
      router.back();
      return;
    }
    Alert.alert(
      "Enregistrement en cours",
      "Terminer l'enregistrement et le sauvegarder avant de quitter ?",
      [
        { text: "Rester sur l'écran", style: "cancel" },
        {
          text: "Terminer et quitter",
          onPress: async () => {
            const recording = await session.stop();
            if (recording) await refreshSaved();
            router.back();
          },
        },
      ],
    );
  }, [refreshSaved, router, session]);

  // Bouton retour Android : même garde-fou que le bouton de l'écran.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!session.isActive) return false;
      leave();
      return true;
    });
    return () => subscription.remove();
  }, [leave, session.isActive]);

  const displayError = notice ?? session.error;

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
          onPress={leave}
          hitSlop={10}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          <Text style={[typography.label, { color: colors.textSecondary }]}>Retour</Text>
        </Pressable>
        <Text style={[typography.title, { flex: 1, textAlign: "right" }]}>Enregistrement</Text>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={typography.labelMedium}>Matière du cours</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {SUBJECTS.map((item) => (
            <SubjectChip
              key={item.id}
              label={item.label}
              accent={item.accent}
              selected={item.id === subject}
              disabled={locked}
              onPress={() => setSubject(item.id)}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={typography.labelMedium}>Titre (facultatif)</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          editable={!locked}
          placeholder="Ex. : Les suites arithmétiques"
          placeholderTextColor={colors.textMuted}
          maxLength={80}
          style={{
            height: 50,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: 16,
            color: colors.textPrimary,
            fontSize: 15,
            opacity: locked ? 0.5 : 1,
          }}
        />
        <Text style={typography.labelSmall}>
          Sans titre, l’enregistrement prendra le nom de la matière et l’heure du cours.
        </Text>
      </View>

      <Card
        padding={20}
        borderColor={
          session.phase === "recording"
            ? withAlpha(colors.coral, 0.45)
            : session.phase === "paused"
              ? withAlpha(colors.amber, 0.4)
              : undefined
        }
        style={{ gap: 16 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              paddingHorizontal: 11,
              paddingVertical: 5,
              backgroundColor: withAlpha(phaseColor(session.phase), 0.14),
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: phaseColor(session.phase),
              }}
            />
            <Text style={[typography.labelSmall, { color: phaseColor(session.phase) }]}>
              {PHASE_LABELS[session.phase]}
            </Text>
          </View>
          <Text style={[typography.labelSmall, { flex: 1, textAlign: "right" }]}>
            AAC · 44,1 kHz
          </Text>
        </View>

        <Text
          accessibilityLabel={`Chronomètre : ${formatRecordingTimer(session.elapsedMs)}`}
          style={{
            fontSize: 52,
            lineHeight: 58,
            fontWeight: "700",
            letterSpacing: -1.5,
            color: colors.textPrimary,
            fontVariant: ["tabular-nums"],
            textAlign: "center",
          }}
        >
          {formatRecordingTimer(session.elapsedMs)}
        </Text>

        <Waveform levels={session.levels} active={session.phase === "recording"} />

        <Text style={[typography.labelSmall, { textAlign: "center" }]}>
          {session.phase === "recording"
            ? "Capture en cours · gardez l’application ouverte"
            : session.phase === "paused"
              ? "Capture en pause · le chronomètre est arrêté"
              : "La capture s’arrête si vous quittez l’application"}
        </Text>
      </Card>

      <Controls
        phase={session.phase}
        onStart={handleStart}
        onPause={session.pause}
        onResume={session.resume}
        onStop={handleStop}
      />

      {displayError ? (
        <Card borderColor={withAlpha(colors.coral, 0.4)}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Ionicons name="alert-circle" size={20} color={colors.coral} />
            <Text
              style={[typography.bodySmall, { flex: 1, color: colors.textPrimary }]}
            >
              {displayError}
            </Text>
          </View>
        </Card>
      ) : null}

      {session.permission.denied && !session.permission.canAskAgain ? (
        <Card borderColor={withAlpha(colors.amber, 0.35)}>
          <Text style={typography.title}>Microphone bloqué</Text>
          <Text
            style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 6 }]}
          >
            Android ne proposera plus la demande. Ouvrez les réglages de
            l’application, section Autorisations, puis activez le microphone.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void Linking.openSettings();
            }}
            hitSlop={8}
            style={{ paddingVertical: 10 }}
          >
            <Text style={[typography.label, { color: colors.amber }]}>
              Ouvrir les réglages
            </Text>
          </Pressable>
        </Card>
      ) : null}

      {lastSaved ? (
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
              gap: 6,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="checkmark-circle" size={20} color={colors.green} />
              <Text style={[typography.title, { flex: 1 }]}>Enregistrement sauvegardé</Text>
            </View>
            <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>
              {lastSaved.title}
            </Text>
            <Text style={typography.labelSmall}>
              {getSubject(lastSaved.subject).label} ·{" "}
              {formatRecordingDuration(lastSaved.durationMs)} ·{" "}
              {lastSaved.fileName}
            </Text>
            <Text style={[typography.labelSmall, { color: colors.blueSoft, marginTop: 4 }]}>
              En attente d’analyse · le panier le prendra en compte (5 fichiers maximum).
            </Text>
          </View>
        </LinearGradient>
      ) : null}

      <SectionHeader
        title="Enregistrements sauvegardés"
        actionLabel={
          savedRecordings.length > 0
            ? `${savedRecordings.length} fichier${savedRecordings.length > 1 ? "s" : ""}`
            : undefined
        }
        style={{ marginTop: 8 }}
      />

      {savedRecordings.length === 0 ? (
        <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
          Aucun enregistrement pour l’instant. Le premier cours terminé apparaîtra ici.
        </Text>
      ) : (
        savedRecordings.map((recording) => (
          <SavedRecordingRow key={recording.id} recording={recording} />
        ))
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Sélection de la matière
// ---------------------------------------------------------------------------

function SubjectChip({
  label,
  accent,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  accent: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`Matière ${label}`}
      disabled={disabled}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        borderRadius: 999,
        paddingHorizontal: 13,
        paddingVertical: 9,
        borderWidth: 1,
        borderColor: selected ? withAlpha(accent, 0.6) : colors.border,
        backgroundColor: selected ? withAlpha(accent, 0.16) : colors.surface,
        opacity: disabled && !selected ? 0.45 : 1,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: selected ? accent : colors.textMuted,
        }}
      />
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

// ---------------------------------------------------------------------------
// Commandes
// ---------------------------------------------------------------------------

function Controls({
  phase,
  onStart,
  onPause,
  onResume,
  onStop,
}: {
  phase: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}) {
  if (phase === "idle") {
    return (
      <GradientButton
        text="Démarrer l’enregistrement"
        icon="mic"
        onPress={onStart}
      />
    );
  }

  if (phase === "starting" || phase === "saving") {
    return (
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <ActivityIndicator color={colors.violetSoft} />
          <Text style={[typography.bodySmall, { flex: 1 }]}>
            {phase === "starting"
              ? "Préparation du microphone et du fichier…"
              : "Sauvegarde du fichier et des informations…"}
          </Text>
        </View>
      </Card>
    );
  }

  const paused = phase === "paused";

  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {paused ? (
        <ActionButton
          label="Reprendre"
          icon="play"
          variant="primary"
          onPress={onResume}
        />
      ) : (
        <ActionButton
          label="Pause"
          icon="pause"
          variant="outline"
          onPress={onPause}
        />
      )}
      <ActionButton
        label="Terminer"
        icon="stop"
        variant="danger"
        onPress={onStop}
      />
    </View>
  );
}

function ActionButton({
  label,
  icon,
  variant,
  onPress,
}: {
  label: string;
  icon: IoniconName;
  variant: "primary" | "outline" | "danger";
  onPress: () => void;
}) {
  const primary = variant === "primary";
  const foreground = primary
    ? "#FFFFFF"
    : variant === "danger"
      ? colors.coral
      : colors.textPrimary;
  const background = variant === "danger" ? withAlpha(colors.coral, 0.16) : colors.surfaceHigh;
  const borderColor = variant === "danger" ? withAlpha(colors.coral, 0.45) : colors.border;

  const content = (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <Ionicons name={icon} size={20} color={foreground} />
      <Text style={[typography.title, { color: foreground }]}>{label}</Text>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 56,
        borderRadius: radii.md,
        overflow: "hidden",
        opacity: pressed ? 0.88 : 1,
      })}
    >
      {primary ? (
        <LinearGradient
          colors={gradients.record}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={{
            flex: 1,
            backgroundColor: background,
            borderWidth: 1,
            borderColor,
            borderRadius: radii.md,
          }}
        >
          {content}
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Liste locale
// ---------------------------------------------------------------------------

function SavedRecordingRow({ recording }: { recording: Recording }) {
  const subject = getSubject(recording.subject);

  return (
    <Card padding={14}>
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
        </View>

        {recording.addedToBasketAt ? (
          <Text style={[typography.labelSmall, { color: colors.greenSoft }]}>Au panier</Text>
        ) : (
          <Text style={[typography.labelSmall, { color: colors.blueSoft }]}>À analyser</Text>
        )}
      </View>
    </Card>
  );
}
