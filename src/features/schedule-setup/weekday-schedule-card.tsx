import { StyleSheet, Switch, Text, View } from "react-native";

import { TextField } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { radius, spacing, typography } from "@/theme";

import { isValidTime, type WeekdayDraft } from "./schedule-setup-model";

type WeekdayScheduleCardProps = Readonly<{
  day: WeekdayDraft;
  submitted: boolean;
  onChange: (update: Partial<WeekdayDraft>) => void;
}>;

export function WeekdayScheduleCard({
  day,
  submitted,
  onChange,
}: WeekdayScheduleCardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headingGroup}>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={1.6}
            style={[styles.title, { color: theme.text }]}
          >
            {day.label}
          </Text>
          <Text
            maxFontSizeMultiplier={1.8}
            style={[styles.status, { color: theme.textSecondary }]}
          >
            {day.hasSchedule ? "最初の予定あり" : "予定なし"}
          </Text>
        </View>
        <Switch
          accessibilityLabel={`${day.label}に予定がある`}
          onValueChange={(hasSchedule) => onChange({ hasSchedule })}
          thumbColor={day.hasSchedule ? theme.onPrimary : undefined}
          trackColor={{ false: theme.borderStrong, true: theme.primary }}
          value={day.hasSchedule}
        />
      </View>
      {day.hasSchedule ? (
        <View style={styles.fields}>
          <TextField
            errorMessage={
              submitted && !day.title.trim() ? "予定名は必須です" : undefined
            }
            label="最初の予定"
            onChangeText={(title) => onChange({ title })}
            placeholder="例: 1限"
            required
            value={day.title}
          />
          <TextField
            errorMessage={
              submitted && !isValidTime(day.startTime)
                ? "HH:mm形式で入力してください"
                : undefined
            }
            helperText="24時間表記（例: 08:50）"
            keyboardType="numbers-and-punctuation"
            label="開始時刻"
            onChangeText={(startTime) => onChange({ startTime })}
            placeholder="08:50"
            required
            value={day.startTime}
          />
          <TextField
            label="場所（任意）"
            onChangeText={(locationLabel) => onChange({ locationLabel })}
            placeholder="例: 講義棟A"
            value={day.locationLabel}
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
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  headingGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
  },
  status: {
    ...typography.caption,
  },
  fields: {
    gap: spacing.lg,
  },
});
