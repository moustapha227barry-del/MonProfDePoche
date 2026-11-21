import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/Card";
import type { Recording } from "@/domain/course";
import { getSubject } from "@/domain/subject";
import { withAlpha } from "@/lib/color";
import { formatRecordingDate, formatRecordingDuration } from "@/lib/recording";
import { colors, radii, typography } from "@/theme";

type RecordingLibraryRowProps = {
  recording: Recording;
  missing: boolean;
  playing: boolean;
  positionMs: number;
  editing: boolean;
  draftTitle: string;
  onChangeDraft: (value: string) => void;
  onTogglePlay: () => void;
  onStartEdit: () => void;
  onSaveTitle: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
};

/**
 * Carte d'un enregistrement sauvegardé : écoute, renommage et suppression.
 * La suppression demande confirmation dans l'écran parent ; ici, on ne fait
 * qu'exposer les actions.
 */
export function RecordingLibraryRow({
  recording,
  missing,
  playing,
  positionMs,
  editing,
  draftTitle,
  onChangeDraft,
  onTogglePlay,
  onStartEdit,
  onSaveTitle,
  onCancelEdit,
  onDelete,
}: RecordingLibraryRowProps) {
  const subject = getSubject(recording.subject);
  const ratio =
    recording.durationMs > 0 ? Math.min(1, Math.max(0, positionMs / recording.durationMs)) : 0;

  return (
    <Card padding={14} borderColor={missing ? withAlpha(colors.coral, 0.4) : undefined}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            missing
              ? "Fichier introuvable"
              : playing
                ? `Mettre en pause ${recording.title}`
                : `Écouter ${recording.title}`
          }
          accessibilityState={{ disabled: missing }}
          disabled={missing}
          onPress={onTogglePlay}
          hitSlop={6}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: withAlpha(missing ? colors.coral : subject.accent, 0.16),
            borderWidth: 1,
            borderColor: withAlpha(missing ? colors.coral : subject.accent, 0.35),
          }}
        >
          <Ionicons
            name={missing ? "alert-circle" : playing ? "pause" : "play"}
            size={20}
            color={missing ? colors.coral : subject.accent}
          />
        </Pressable>

        <View style={{ flex: 1 }}>
          {editing ? (
            <TextInput
              value={draftTitle}
              onChangeText={onChangeDraft}
              autoFocus
              maxLength={80}
              placeholder="Titre du cours"
              placeholderTextColor={colors.textMuted}
              style={{
                height: 40,
                borderRadius: radii.xs,
                borderWidth: 1,
                borderColor: withAlpha(colors.violet, 0.5),
                backgroundColor: colors.inkElevated,
                paddingHorizontal: 10,
                color: colors.textPrimary,
                fontSize: 15,
              }}
            />
          ) : (
            <Text numberOfLines={1} style={typography.title}>
              {recording.title}
            </Text>
          )}

          <Text numberOfLines={1} style={[typography.labelSmall, { marginTop: 4 }]}>
            {subject.label} · {formatRecordingDuration(recording.durationMs)} ·{" "}
            {formatRecordingDate(recording.createdAt)}
          </Text>

          {missing ? (
            <Text style={[typography.labelSmall, { color: colors.coral, marginTop: 4 }]}>
              Fichier audio introuvable sur le téléphone
            </Text>
          ) : null}

          {playing ? (
            <View
              style={{
                height: 4,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.08)",
                marginTop: 8,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 4,
                  width: `${ratio * 100}%`,
                  borderRadius: 999,
                  backgroundColor: subject.accent,
                }}
              />
            </View>
          ) : null}
        </View>

        <Text
          style={[
            typography.labelSmall,
            { color: recording.addedToBasketAt ? colors.greenSoft : colors.blueSoft },
          ]}
        >
          {recording.addedToBasketAt ? "Au panier" : "À analyser"}
        </Text>
      </View>

      {editing ? (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          <RowAction label="Enregistrer" icon="checkmark" tone="green" onPress={onSaveTitle} />
          <RowAction label="Annuler" icon="close" tone="muted" onPress={onCancelEdit} />
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <RowAction
            label={playing ? "Pause" : "Écouter"}
            icon={playing ? "pause" : "play"}
            tone="blue"
            disabled={missing}
            onPress={onTogglePlay}
          />
          <RowAction label="Renommer" icon="pencil" tone="violet" onPress={onStartEdit} />
          <RowAction label="Supprimer" icon="trash-outline" tone="coral" onPress={onDelete} />
        </View>
      )}
    </Card>
  );
}

function RowAction({
  label,
  icon,
  tone,
  disabled,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: "green" | "blue" | "violet" | "coral" | "muted";
  disabled?: boolean;
  onPress: () => void;
}) {
  const accent =
    tone === "green"
      ? colors.greenSoft
      : tone === "blue"
        ? colors.blueSoft
        : tone === "violet"
          ? colors.violetSoft
          : tone === "coral"
            ? colors.coral
            : colors.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: withAlpha(accent, 0.12),
        borderWidth: 1,
        borderColor: withAlpha(accent, 0.3),
        opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
      })}
    >
      <Ionicons name={icon} size={14} color={accent} />
      <Text style={[typography.labelSmall, { color: accent }]}>{label}</Text>
    </Pressable>
  );
}
