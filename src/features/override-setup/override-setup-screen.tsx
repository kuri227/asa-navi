import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ValidationError } from "@/application/errors/validation-error";
import type { DateOverrideSetupInput } from "@/application/override-setup";
import { AppButton, FormSection, ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { radius, spacing, typography } from "@/theme";

import { OverrideCard } from "./override-card";
import {
  createEmptyOverride,
  toOverrideInputs,
  type OverrideDraft,
} from "./override-setup-model";

type Props = Readonly<{
  onSave: (input: readonly DateOverrideSetupInput[]) => Promise<void>;
  onSaved: () => void;
}>;

export function OverrideSetupScreen({ onSave, onSaved }: Props) {
  const theme = useTheme();
  const nextId = useRef(1);
  const [drafts, setDrafts] = useState<OverrideDraft[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();

  const handleSave = async () => {
    setSubmitted(true);
    setFormError(undefined);
    const inputs = toOverrideInputs(drafts);
    if (!inputs) {
      setFormError("未入力または重複している例外日を確認してください。");
      return;
    }
    setSaving(true);
    try {
      await onSave(inputs);
      onSaved();
    } catch (error) {
      setFormError(
        error instanceof ValidationError
          ? error.message
          : "例外日を保存できませんでした。もう一度お試しください。",
      );
    } finally {
      setSaving(false);
    }
  };

  const dates = drafts.map(({ targetDate }) => targetDate.trim());
  return (
    <ScreenContainer
      footer={
        <AppButton
          label={drafts.length === 0 ? "今は追加しない" : "次へ"}
          loading={saving}
          onPress={() => void handleSave()}
        />
      }
    >
      <FormSection
        description="休講や特別時間割など、通常の曜日予定と異なる日だけ追加します。後から変更できます。"
        title="特別日・例外予定を追加"
      >
        {formError ? (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            maxFontSizeMultiplier={1.8}
            style={[styles.error, { color: theme.error }]}
          >
            {formError}
          </Text>
        ) : null}
      </FormSection>
      {drafts.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: theme.surfaceSubtle }]}>
          <Text
            maxFontSizeMultiplier={1.6}
            style={[styles.emptyTitle, { color: theme.text }]}
          >
            例外日はまだありません
          </Text>
          <Text
            maxFontSizeMultiplier={1.8}
            style={[styles.emptyBody, { color: theme.textSecondary }]}
          >
            休講や開始時刻が違う日が決まっていれば追加してください。
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {drafts.map((draft, index) => (
            <OverrideCard
              draft={draft}
              duplicateDate={
                Boolean(draft.targetDate.trim()) &&
                dates.filter((date) => date === draft.targetDate.trim())
                  .length > 1
              }
              index={index}
              key={draft.clientId}
              onChange={(update) =>
                setDrafts((current) =>
                  current.map((item) =>
                    item.clientId === draft.clientId
                      ? { ...item, ...update }
                      : item,
                  ),
                )
              }
              onRemove={() =>
                setDrafts((current) =>
                  current.filter((item) => item.clientId !== draft.clientId),
                )
              }
              submitted={submitted}
            />
          ))}
        </View>
      )}
      <AppButton
        label="例外日を追加"
        onPress={() => {
          const clientId = `override-${nextId.current}`;
          nextId.current += 1;
          setDrafts((current) => [...current, createEmptyOverride(clientId)]);
        }}
        variant="secondary"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  error: { ...typography.bodyStrong },
  empty: { borderRadius: radius.card, padding: spacing.xxl, gap: spacing.sm },
  emptyTitle: { ...typography.bodyStrong },
  emptyBody: { ...typography.body },
  list: { gap: spacing.xl },
});
