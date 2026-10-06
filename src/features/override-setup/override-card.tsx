import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton, TextField } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { layout, radius, spacing, typography } from "@/theme";

import { isValidDate, type OverrideDraft } from "./override-setup-model";

type Props = Readonly<{
  draft: OverrideDraft;
  index: number;
  submitted: boolean;
  duplicateDate: boolean;
  onChange: (update: Partial<OverrideDraft>) => void;
  onRemove: () => void;
}>;

export function OverrideCard({
  draft,
  index,
  submitted,
  duplicateDate,
  onChange,
  onRemove,
}: Props) {
  const theme = useTheme();
  const invalidDate =
    submitted && (!isValidDate(draft.targetDate) || duplicateDate);
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.6}
          style={[styles.title, { color: theme.text }]}
        >
          例外日 {index + 1}
        </Text>
        <AppButton label="削除" onPress={onRemove} variant="destructive" />
      </View>
      <TextField
        errorMessage={
          invalidDate
            ? duplicateDate
              ? "同じ日付が重複しています"
              : "YYYY-MM-DD形式で入力してください"
            : undefined
        }
        helperText="例: 2026-10-13"
        keyboardType="numbers-and-punctuation"
        label="対象日"
        onChangeText={(targetDate) => onChange({ targetDate })}
        required
        value={draft.targetDate}
      />
      <View accessibilityRole="radiogroup" style={styles.types}>
        {(
          [
            ["cancel", "休講・予定なし"],
            ["replace", "特別時間割"],
          ] as const
        ).map(([value, label]) => {
          const selected = draft.overrideType === value;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={value}
              onPress={() => onChange({ overrideType: value })}
              style={[
                styles.type,
                {
                  backgroundColor: selected
                    ? theme.surfaceSelected
                    : theme.background,
                  borderColor: selected ? theme.primary : theme.border,
                },
              ]}
            >
              <Text
                maxFontSizeMultiplier={1.6}
                style={[styles.typeLabel, { color: theme.text }]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {draft.overrideType === "replace" ? (
        <View style={styles.fields}>
          <TextField
            errorMessage={
              submitted && !draft.title.trim() ? "予定名は必須です" : undefined
            }
            label="最初の予定"
            onChangeText={(title) => onChange({ title })}
            required
            value={draft.title}
          />
          <TextField
            errorMessage={
              submitted &&
              !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.startTime.trim())
                ? "HH:mm形式で入力してください"
                : undefined
            }
            label="開始時刻"
            onChangeText={(startTime) => onChange({ startTime })}
            required
            value={draft.startTime}
          />
          <TextField
            label="場所（任意）"
            onChangeText={(locationLabel) => onChange({ locationLabel })}
            value={draft.locationLabel}
          />
        </View>
      ) : null}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  title: { ...typography.title },
  types: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  type: {
    minHeight: layout.minimumTouchTarget,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  typeLabel: { ...typography.label },
  fields: { gap: spacing.lg },
});
