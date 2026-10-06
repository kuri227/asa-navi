import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ValidationError } from "@/application/errors/validation-error";
import type { MorningRoutineTaskInput } from "@/application/routine-setup";
import { AppButton, FormSection, ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { spacing, typography } from "@/theme";

import {
  createCustomTask,
  createPresetTask,
  moveTask,
  routinePresets,
  toRoutineInputs,
  type RoutineTaskDraft,
} from "./routine-setup-model";
import { RoutineTaskCard } from "./routine-task-card";

type Props = Readonly<{
  onSave: (input: readonly MorningRoutineTaskInput[]) => Promise<void>;
  onSaved: () => void;
}>;

export function RoutineSetupScreen({ onSave, onSaved }: Props) {
  const theme = useTheme();
  const nextId = useRef(1);
  const [drafts, setDrafts] = useState<RoutineTaskDraft[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();

  const allocateId = () => {
    const id = `routine-${nextId.current}`;
    nextId.current += 1;
    return id;
  };

  const handleSave = async () => {
    setSubmitted(true);
    setFormError(undefined);
    const input = toRoutineInputs(drafts);
    if (!input) {
      setFormError(
        drafts.length === 0
          ? "朝のタスクを1つ以上追加してください。"
          : "入力内容を確認してください。",
      );
      return;
    }
    setSaving(true);
    try {
      await onSave(input);
      onSaved();
    } catch (error) {
      setFormError(
        error instanceof ValidationError
          ? error.message
          : "朝ルーティンを保存できませんでした。もう一度お試しください。",
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
        description="起床後から出発までに行うことを順番に登録します。時間が足りないときは最短時間まで短縮します。"
        title="朝のルーティンを設定しましょう"
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
      <View style={styles.section}>
        <Text
          maxFontSizeMultiplier={1.6}
          style={[styles.sectionTitle, { color: theme.text }]}
        >
          プリセット
        </Text>
        <View style={styles.presetList}>
          {routinePresets.map((preset) => (
            <AppButton
              key={preset.label}
              label={`${preset.label}を追加`}
              onPress={() =>
                setDrafts((current) => [
                  ...current,
                  createPresetTask(allocateId(), preset),
                ])
              }
              style={styles.presetButton}
              variant="secondary"
            />
          ))}
        </View>
      </View>
      <View style={styles.list}>
        {drafts.map((draft, index) => (
          <RoutineTaskCard
            draft={draft}
            index={index}
            isFirst={index === 0}
            isLast={index === drafts.length - 1}
            key={draft.clientId}
            onChange={(update) =>
              setDrafts((current) =>
                current.map((task) =>
                  task.clientId === draft.clientId
                    ? { ...task, ...update }
                    : task,
                ),
              )
            }
            onMoveDown={() =>
              setDrafts((current) => moveTask(current, index, index + 1))
            }
            onMoveUp={() =>
              setDrafts((current) => moveTask(current, index, index - 1))
            }
            onRemove={() =>
              setDrafts((current) =>
                current.filter((task) => task.clientId !== draft.clientId),
              )
            }
            submitted={submitted}
          />
        ))}
      </View>
      <AppButton
        label="自分でタスクを追加"
        onPress={() =>
          setDrafts((current) => [...current, createCustomTask(allocateId())])
        }
        variant="secondary"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  error: { ...typography.bodyStrong },
  section: { gap: spacing.md },
  sectionTitle: { ...typography.title },
  presetList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  presetButton: { flexGrow: 1 },
  list: { gap: spacing.xl },
});
