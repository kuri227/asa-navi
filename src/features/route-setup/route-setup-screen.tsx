import { useRef, useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";

import { ValidationError } from "@/application/errors/validation-error";
import type { CommuteRouteInput } from "@/application/route-setup";
import {
  AppButton,
  FormSection,
  ScreenContainer,
  TextField,
} from "@/components/ui";
import { ReorderPanel } from "@/components/ui/reorder-panel";
import { useTheme } from "@/hooks/use-theme";
import { spacing, typography } from "@/theme";

import {
  createCommuteRouteInput,
  createEmptySegment,
  hasMissingRequiredLabels,
  type SegmentDraft,
} from "./route-setup-model";
import { RouteSegmentForm, segmentOrderLabel } from "./route-segment-form";

type RouteSetupScreenProps = Readonly<{
  onSave: (input: CommuteRouteInput) => Promise<void>;
  onSaved: () => void;
}>;

export function RouteSetupScreen({ onSave, onSaved }: RouteSetupScreenProps) {
  const theme = useTheme();
  const nextSegmentId = useRef(2);
  const [routeName, setRouteName] = useState("いつもの通学ルート");
  const [segments, setSegments] = useState<SegmentDraft[]>([
    createEmptySegment("segment-1"),
  ]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [reorderId, setReorderId] = useState<string>();
  const placeLabels = segments.flatMap(({ fromLabel, toLabel }) => [
    fromLabel,
    toLabel,
  ]);

  const openOrder = (id: string) => {
    Keyboard.dismiss();
    setReorderId(id);
  };

  const updateSegment = (index: number, update: Partial<SegmentDraft>) => {
    setSegments((current) =>
      current.map((segment, segmentIndex) =>
        segmentIndex === index ? { ...segment, ...update } : segment,
      ),
    );
  };

  const moveSegment = (index: number, destination: number) => {
    setSegments((current) => {
      if (destination < 0 || destination >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[destination]] = [
        reordered[destination],
        reordered[index],
      ];
      return reordered;
    });
  };

  const handleSave = async () => {
    setSubmitted(true);
    setFormError(undefined);
    const input = createCommuteRouteInput(routeName, segments);
    if (!input || !routeName.trim() || hasMissingRequiredLabels(segments)) {
      setFormError("未入力または正しくない項目を確認してください。");
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
          : "通学ルートを保存できませんでした。もう一度お試しください。",
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
          description="徒歩・電車・バスなどを、家から学校までの順番で登録します。"
          title="通学ルートを設定しましょう"
        >
          {formError ? (
            <Text
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              style={[styles.formError, { color: theme.error }]}
            >
              {formError}
            </Text>
          ) : null}
          <TextField
            errorMessage={
              submitted && !routeName.trim() ? "ルート名は必須です" : undefined
            }
            label="ルート名"
            onChangeText={setRouteName}
            required
            returnKeyType="next"
            value={routeName}
          />
        </FormSection>

        <View style={styles.segmentList}>
          {segments.length > 1 ? (
            <AppButton
              label="通学区間の順番を変更"
              onPress={() => openOrder(segments[0].clientId)}
              variant="secondary"
            />
          ) : null}
          {segments.map((segment, index) => (
            <RouteSegmentForm
              index={index}
              key={segment.clientId}
              placeLabels={placeLabels}
              previousDestination={segments[index - 1]?.toLabel}
              onChange={(update) => updateSegment(index, update)}
              onReorder={() => openOrder(segment.clientId)}
              onRemove={() =>
                setSegments((current) =>
                  current.filter((_, segmentIndex) => segmentIndex !== index),
                )
              }
              segment={segment}
              segmentCount={segments.length}
              submitted={submitted}
            />
          ))}
        </View>

        <AppButton
          label="区間を追加"
          onPress={() => {
            const id = `segment-${nextSegmentId.current}`;
            nextSegmentId.current += 1;
            setSegments((current) => [...current, createEmptySegment(id)]);
          }}
          variant="secondary"
        />
      </ScreenContainer>
      {reorderId !== undefined ? (
        <ReorderPanel
          initialItemId={reorderId}
          items={segments.map((segment) => ({
            id: segment.clientId,
            label: segmentOrderLabel(segment),
          }))}
          onClose={() => setReorderId(undefined)}
          onMove={moveSegment}
          title="通学区間の順番"
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  formError: {
    ...typography.bodyStrong,
  },
  segmentList: {
    gap: spacing.xl,
  },
});
