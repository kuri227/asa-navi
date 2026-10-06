import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton, TextField } from "@/components/ui";
import type { RouteSegmentMode } from "@/domain/planning";
import { useTheme } from "@/hooks/use-theme";
import { layout, radius, spacing, typography } from "@/theme";

import { isValidDuration, type SegmentDraft } from "./route-setup-model";

type RouteSegmentFormProps = Readonly<{
  segment: SegmentDraft;
  index: number;
  segmentCount: number;
  submitted: boolean;
  onChange: (update: Partial<SegmentDraft>) => void;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
}>;

const MODE_OPTIONS: readonly { value: RouteSegmentMode; label: string }[] = [
  { value: "walk", label: "徒歩" },
  { value: "train", label: "電車" },
  { value: "bus", label: "バス" },
  { value: "bicycle", label: "自転車" },
  { value: "other", label: "その他" },
];

export function RouteSegmentForm({
  segment,
  index,
  segmentCount,
  submitted,
  onChange,
  onMove,
  onRemove,
}: RouteSegmentFormProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: theme.text }]}
      >
        区間 {index + 1}
      </Text>
      <View accessibilityRole="radiogroup" style={styles.modeOptions}>
        {MODE_OPTIONS.map((option) => {
          const selected = segment.mode === option.value;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={option.value}
              onPress={() => onChange({ mode: option.value })}
              style={({ pressed }) => [
                styles.modeOption,
                {
                  backgroundColor: selected
                    ? theme.surfaceSelected
                    : theme.background,
                  borderColor: selected ? theme.primary : theme.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.modeLabel, { color: theme.text }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <TextField
        errorMessage={
          submitted && !segment.fromLabel.trim() ? "始点は必須です" : undefined
        }
        label="始点"
        onChangeText={(fromLabel) => onChange({ fromLabel })}
        placeholder="例: 自宅"
        required
        value={segment.fromLabel}
      />
      <TextField
        errorMessage={
          submitted && !segment.toLabel.trim() ? "終点は必須です" : undefined
        }
        label="終点"
        onChangeText={(toLabel) => onChange({ toLabel })}
        placeholder="例: JR吹田駅"
        required
        value={segment.toLabel}
      />
      <TextField
        helperText="電車・バス等で必要な場合のみ"
        label="路線名（任意）"
        onChangeText={(lineName) => onChange({ lineName })}
        placeholder="例: JR京都線"
        value={segment.lineName}
      />
      <TextField
        errorMessage={
          submitted && !isValidDuration(segment.durationMin)
            ? "0〜1440の整数で入力してください"
            : undefined
        }
        keyboardType="number-pad"
        label="所要時間（分）"
        onChangeText={(durationMin) => onChange({ durationMin })}
        placeholder="例: 8"
        required
        value={segment.durationMin}
      />
      <View style={styles.actions}>
        <AppButton
          disabled={index === 0}
          label="上へ"
          onPress={() => onMove(-1)}
          style={styles.action}
          variant="ghost"
        />
        <AppButton
          disabled={index === segmentCount - 1}
          label="下へ"
          onPress={() => onMove(1)}
          style={styles.action}
          variant="ghost"
        />
        <AppButton
          disabled={segmentCount === 1}
          label="削除"
          onPress={onRemove}
          style={styles.action}
          variant="destructive"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    ...typography.title,
  },
  modeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  modeOption: {
    minHeight: layout.minimumTouchTarget,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  modeLabel: {
    ...typography.label,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  action: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  pressed: {
    opacity: 0.72,
  },
});
