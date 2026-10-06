import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ValidationError } from "@/application/errors/validation-error";
import type { WeekdayScheduleSetupInput } from "@/application/schedule-setup";
import { AppButton, FormSection, ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { spacing, typography } from "@/theme";

import {
  createInitialWeek,
  hasInvalidEnabledDay,
  type WeekdayDraft,
} from "./schedule-setup-model";
import { WeekdayScheduleCard } from "./weekday-schedule-card";

type ScheduleSetupScreenProps = Readonly<{
  onSave: (input: readonly WeekdayScheduleSetupInput[]) => Promise<void>;
  onSaved: () => void;
}>;

export function ScheduleSetupScreen({
  onSave,
  onSaved,
}: ScheduleSetupScreenProps) {
  const theme = useTheme();
  const [days, setDays] = useState(createInitialWeek);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();

  const updateDay = (weekday: number, update: Partial<WeekdayDraft>) => {
    setDays((current) =>
      current.map((day) =>
        day.weekday === weekday ? { ...day, ...update } : day,
      ),
    );
  };

  const handleSave = async () => {
    setSubmitted(true);
    setFormError(undefined);
    if (hasInvalidEnabledDay(days)) {
      setFormError("入力内容を確認してください。");
      return;
    }
    setSaving(true);
    try {
      await onSave(days);
      onSaved();
    } catch (error) {
      setFormError(
        error instanceof ValidationError
          ? error.message
          : "曜日予定を保存できませんでした。もう一度お試しください。",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer
      footer={
        <AppButton
          label="次へ"
          loading={saving}
          onPress={() => void handleSave()}
        />
      }
    >
      <FormSection
        description="各曜日で、家を出る基準になる最初の予定を登録します。予定がない曜日はオフにできます。"
        title="曜日の予定を設定しましょう"
      >
        {formError ? (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            maxFontSizeMultiplier={1.8}
            style={[styles.formError, { color: theme.error }]}
          >
            {formError}
          </Text>
        ) : null}
      </FormSection>
      <View style={styles.dayList}>
        {days.map((day) => (
          <WeekdayScheduleCard
            day={day}
            key={day.weekday}
            onChange={(update) => updateDay(day.weekday, update)}
            submitted={submitted}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  formError: {
    ...typography.bodyStrong,
  },
  dayList: {
    gap: spacing.xl,
  },
});
