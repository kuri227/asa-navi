import { useRef, useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";

import { ValidationError } from "@/application/errors/validation-error";
import type { MorningRoutineTaskInput } from "@/application/routine-setup";
import { AppButton, FormSection, ScreenContainer } from "@/components/ui";
import { ReorderPanel } from "@/components/ui/reorder-panel";
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
  const [reorderId, setReorderId] = useState<string>();

  const openOrder = (id: string) => {
    Keyboard.dismiss();
    setReorderId(id);
  };

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
    <>
      <ScreenContainer
        accessibilityHidden={reorderId !== undefined}
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
          {drafts.length > 1 ? (
            <AppButton
              label="朝タスクの順番を変更"
              onPress={() => openOrder(drafts[0].clientId)}
              variant="secondary"
            />
          ) : null}
          {drafts.map((draft, index) => (
            <RoutineTaskCard
              draft={draft}
              index={index}
              canReorder={drafts.length > 1}
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
              onReorder={() => openOrder(draft.clientId)}
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
      {reorderId !== undefined ? (
        <ReorderPanel
          initialItemId={reorderId}
          items={drafts.map((draft) => ({
            id: draft.clientId,
            label: draft.name.trim() || "名前が未入力のタスク",
          }))}
          onClose={() => setReorderId(undefined)}
          onMove={(from, to) =>
            setDrafts((current) => moveTask(current, from, to))
          }
          title="朝タスクの順番"
        />
      ) : null}
    </>
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
