import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton, TextField } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { layout, radius, spacing, typography } from "@/theme";

import { taskError, type RoutineTaskDraft } from "./routine-setup-model";

type Props = Readonly<{
  draft: RoutineTaskDraft;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  submitted: boolean;
  onChange: (update: Partial<RoutineTaskDraft>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}>;

export function RoutineTaskCard({
  draft,
  index,
  isFirst,
  isLast,
  submitted,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: Props) {
  const theme = useTheme();
  const error = submitted ? taskError(draft) : undefined;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Text
          maxFontSizeMultiplier={1.6}
          style={[styles.position, { color: theme.textSecondary }]}
        >
          {index + 1}番目
        </Text>
        <View style={styles.orderActions}>
          <AppButton
            accessibilityHint="このタスクを一つ前へ移動します"
            disabled={isFirst}
            label="上へ"
            onPress={onMoveUp}
            style={styles.smallAction}
            variant="ghost"
          />
          <AppButton
            accessibilityHint="このタスクを一つ後ろへ移動します"
            disabled={isLast}
            label="下へ"
            onPress={onMoveDown}
            style={styles.smallAction}
            variant="ghost"
          />
          <AppButton
            label="削除"
            onPress={onRemove}
            style={styles.smallAction}
            variant="destructive"
          />
        </View>
      </View>
      <TextField
        errorMessage={submitted && !draft.name.trim() ? error : undefined}
        label="タスク名"
        maxLength={80}
        onChangeText={(name) => onChange({ name })}
        required
        value={draft.name}
      />
      <View style={styles.durationRow}>
        <View style={styles.durationField}>
          <TextField
            inputMode="numeric"
            label="通常時間（分）"
            onChangeText={(normalDurationMin) =>
              onChange({ normalDurationMin })
            }
            required
            value={draft.normalDurationMin}
          />
        </View>
        <View style={styles.durationField}>
          <TextField
            inputMode="numeric"
            label="最短時間（分）"
            onChangeText={(minimumDurationMin) =>
              onChange({ minimumDurationMin })
            }
            required
            value={draft.minimumDurationMin}
          />
        </View>
      </View>
      {error && draft.name.trim() ? (
        <Text
          accessibilityLiveRegion="polite"
          maxFontSizeMultiplier={1.8}
          style={[styles.error, { color: theme.error }]}
        >
          {error}
        </Text>
      ) : null}
      <Text
        maxFontSizeMultiplier={1.6}
        style={[styles.label, { color: theme.text }]}
      >
        扱い
      </Text>
      <View accessibilityRole="radiogroup" style={styles.radioGroup}>
        {(["required", "optional"] as const).map((requirement) => {
          const selected = draft.requirement === requirement;
          const label = requirement === "required" ? "必須" : "省略可";
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={requirement}
              onPress={() => onChange({ requirement })}
              style={[
                styles.radio,
                {
                  backgroundColor: selected
                    ? theme.surfaceSelected
                    : theme.surface,
                  borderColor: selected ? theme.primary : theme.borderStrong,
                },
              ]}
            >
              <Text
                maxFontSizeMultiplier={1.6}
                style={{ color: selected ? theme.primary : theme.text }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  position: { ...typography.title, flex: 1 },
  orderActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  smallAction: { minWidth: layout.minimumTouchTarget },
  durationRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  durationField: { flex: 1, minWidth: 130 },
  label: { ...typography.label },
  radioGroup: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  radio: {
    minHeight: layout.minimumTouchTarget,
    minWidth: 112,
    borderWidth: 1,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  error: { ...typography.caption },
});
