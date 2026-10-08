import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ValidationError } from "@/application/errors/validation-error";
import type { DateScheduleOverride } from "@/application/schedule";
import type { TomorrowOverrideInput } from "@/application/tomorrow-override";
import {
  AppButton,
  FormSection,
  ScreenContainer,
  TextField,
} from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { layout, radius, spacing, typography } from "@/theme";

import { formatPlanDate } from "../home/home-plan-formatters";

type Props = Readonly<{
  targetDate: string;
  timeZone: string;
  loadOverride: () => Promise<DateScheduleOverride | null>;
  onSave: (input: TomorrowOverrideInput) => Promise<void>;
  onRestore: () => Promise<void>;
  onDone: () => void;
}>;

type Draft = Readonly<{
  overrideType: "cancel" | "replace";
  title: string;
  startTime: string;
  locationLabel: string;
}>;

const defaultDraft: Draft = {
  overrideType: "cancel",
  title: "",
  startTime: "08:50",
  locationLabel: "",
};

export function TomorrowOverrideScreen({
  targetDate,
  timeZone,
  loadOverride,
  onSave,
  onRestore,
  onDone,
}: Props) {
  const theme = useTheme();
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [hasOverride, setHasOverride] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    void loadOverride()
      .then((override) => {
        if (!active) return;
        setHasOverride(override !== null);
        if (override?.overrideType === "replace") {
          setDraft({
            overrideType: "replace",
            title: override.title,
            startTime: override.startTime,
            locationLabel: override.locationLabel ?? "",
          });
        } else if (override) {
          setDraft(defaultDraft);
        }
      })
      .catch(() => {
        if (active) setError("明日の設定を読み込めませんでした。");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadOverride]);

  const save = async () => {
    setSubmitted(true);
    setError(undefined);
    if (
      draft.overrideType === "replace" &&
      (!draft.title.trim() ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.startTime.trim()))
    ) {
      setError("未入力または形式が違う項目を確認してください。");
      return;
    }
    setSaving(true);
    try {
      await onSave(
        draft.overrideType === "cancel"
          ? { targetDate, overrideType: "cancel" }
          : {
              targetDate,
              overrideType: "replace",
              title: draft.title,
              startTime: draft.startTime,
              locationLabel: draft.locationLabel,
            },
      );
      onDone();
    } catch (caught) {
      setError(
        caught instanceof ValidationError
          ? caught.message
          : "明日の設定を保存できませんでした。",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmRestore = () => {
    Alert.alert(
      "通常の予定に戻しますか？",
      "この日の例外設定だけを削除し、曜日の時間割を使います。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "通常の予定に戻す",
          style: "destructive",
          onPress: () => void restore(),
        },
      ],
    );
  };

  const restore = async () => {
    setSaving(true);
    setError(undefined);
    try {
      await onRestore();
      onDone();
    } catch {
      setError("通常の予定に戻せませんでした。");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.primary} size="large" />
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            設定を読み込んでいます
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      footer={
        <AppButton
          label="保存してホームへ"
          loading={saving}
          onPress={() => void save()}
        />
      }
    >
      <FormSection
        description="この日だけ通常の時間割と異なる場合に設定します。"
        title={`${formatPlanDate(targetDate, timeZone)}の予定`}
      />
      {error ? (
        <Text
          accessibilityRole="alert"
          style={[styles.error, { color: theme.error }]}
        >
          {error}
        </Text>
      ) : null}
      <View accessibilityRole="radiogroup" style={styles.options}>
        {(["cancel", "replace"] as const).map((value) => {
          const selected = draft.overrideType === value;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={value}
              onPress={() =>
                setDraft((current) => ({ ...current, overrideType: value }))
              }
              style={[
                styles.option,
                {
                  backgroundColor: selected
                    ? theme.surfaceSelected
                    : theme.surface,
                  borderColor: selected ? theme.primary : theme.border,
                },
              ]}
            >
              <Text style={[styles.optionLabel, { color: theme.text }]}>
                {value === "cancel" ? "休講・予定なし" : "特別時間割"}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {draft.overrideType === "replace" ? (
        <View style={styles.fields}>
          <TextField
            label="最初の予定"
            required
            value={draft.title}
            onChangeText={(title) =>
              setDraft((current) => ({ ...current, title }))
            }
            errorMessage={
              submitted && !draft.title.trim() ? "予定名は必須です" : undefined
            }
          />
          <TextField
            label="開始時刻"
            required
            value={draft.startTime}
            onChangeText={(startTime) =>
              setDraft((current) => ({ ...current, startTime }))
            }
            errorMessage={
              submitted &&
              !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.startTime.trim())
                ? "HH:mm形式で入力してください"
                : undefined
            }
          />
          <TextField
            label="場所（任意）"
            value={draft.locationLabel}
            onChangeText={(locationLabel) =>
              setDraft((current) => ({ ...current, locationLabel }))
            }
          />
        </View>
      ) : null}
      {hasOverride ? (
        <AppButton
          disabled={saving}
          label="通常の曜日予定に戻す"
          onPress={confirmRestore}
          variant="destructive"
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", gap: spacing.lg },
  body: { ...typography.body },
  error: { ...typography.bodyStrong },
  options: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  option: {
    minHeight: layout.minimumTouchTarget,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  optionLabel: { ...typography.label },
  fields: { gap: spacing.lg },
});
