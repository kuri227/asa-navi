import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import type { ActiveMorningSession } from "@/application/morning-session";
import { AppButton, ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { radius, spacing, typography } from "@/theme";

import { formatPlanTime } from "../home/home-plan-formatters";
import {
  getAdjustmentText,
  getPlanStatusMessage,
  getWakeTimingMessage,
} from "./morning-plan-presenter";

type Props = Readonly<{
  timeZone: string;
  startSession: () => Promise<ActiveMorningSession>;
  onBackHome: () => void;
}>;

type ViewState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "ready"; value: ActiveMorningSession }>
  | Readonly<{ kind: "error" }>;

export function MorningStartScreen({
  timeZone,
  startSession,
  onBackHome,
}: Props) {
  const theme = useTheme();
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [requestNumber, setRequestNumber] = useState(0);
  const retry = useCallback(() => {
    setState({ kind: "loading" });
    setRequestNumber((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    void startSession()
      .then((value) => {
        if (active) setState({ kind: "ready", value });
      })
      .catch(() => {
        if (active) setState({ kind: "error" });
      });
    return () => {
      active = false;
    };
  }, [requestNumber, startSession]);

  if (state.kind === "loading") {
    return (
      <ScreenContainer scrollable={false}>
        <View accessibilityLabel="朝プランを準備中" style={styles.centered}>
          <ActivityIndicator color={theme.primary} size="large" />
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            現在時刻から朝プランを組み直しています
          </Text>
        </View>
      </ScreenContainer>
    );
  }
  if (state.kind === "error") {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.centered}>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: theme.text }]}
          >
            朝プランを開始できませんでした
          </Text>
          <Text
            accessibilityRole="alert"
            style={[styles.body, { color: theme.textSecondary }]}
          >
            保存済みの進捗は消えていません。もう一度読み込んでください。
          </Text>
          <AppButton label="もう一度試す" onPress={retry} />
          <AppButton
            label="ホームへ戻る"
            onPress={onBackHome}
            variant="ghost"
          />
        </View>
      </ScreenContainer>
    );
  }

  const { value } = state;
  const currentTask = value.executions.find(
    ({ status }) => status === "active",
  );
  const taskName = value.plan.tasks.find(
    ({ taskId }) => taskId === currentTask?.taskTemplateId,
  )?.name;
  const taskNames = new Map(
    value.plan.tasks.map((task) => [task.taskId, task.name]),
  );
  const adjustmentTexts = value.plan.adjustments
    .map((adjustment) => getAdjustmentText(adjustment, taskNames))
    .filter((text): text is string => text !== null);
  const late = value.plan.lateByMin > 0;
  return (
    <ScreenContainer>
      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: theme.primary }]}>
          おはようございます
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.headingText, { color: theme.text }]}
        >
          今日の朝プラン
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          {getWakeTimingMessage(
            value.session.actualWakeAt,
            value.session.plannedWakeAt,
          )}
        </Text>
      </View>
      <View
        accessibilityLiveRegion="polite"
        style={[
          styles.status,
          {
            backgroundColor: late
              ? theme.errorContainer
              : theme.successContainer,
          },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            { color: late ? theme.error : theme.success },
          ]}
        >
          {getPlanStatusMessage(value.plan)}
        </Text>
      </View>
      <View
        style={[
          styles.summary,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          出発目安
        </Text>
        <Text style={[styles.time, { color: theme.text }]}>
          {formatPlanTime(value.plan.predictedDepartureAt, timeZone)}
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          最終出発 {formatPlanTime(value.plan.latestDepartureAt, timeZone)} ・
          遅刻見込み {value.plan.lateByMin}分
        </Text>
      </View>
      <View
        style={[
          styles.currentTask,
          { backgroundColor: theme.successContainer },
        ]}
      >
        <Text style={[styles.label, { color: theme.success }]}>
          最初にすること
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>
          {taskName ?? "出発の準備は完了です"}
        </Text>
        {currentTask ? (
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            目安 {currentTask.plannedDurationMin}分
          </Text>
        ) : null}
      </View>
      {adjustmentTexts.length > 0 ? (
        <View
          style={[
            styles.adjustments,
            { backgroundColor: theme.warningContainer },
          ]}
        >
          <Text style={[styles.title, { color: theme.warning }]}>
            間に合わせるための調整
          </Text>
          {adjustmentTexts.map((text) => (
            <Text key={text} style={[styles.body, { color: theme.text }]}>
              ・{text}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.taskList}>
        <Text style={[styles.title, { color: theme.text }]}>
          このあとの流れ
        </Text>
        {value.plan.tasks.map((task, index) => (
          <View
            key={task.taskId}
            style={[styles.taskRow, { borderBottomColor: theme.border }]}
          >
            <Text style={[styles.taskNumber, { color: theme.primary }]}>
              {index + 1}
            </Text>
            <View style={styles.taskContent}>
              <Text style={[styles.bodyStrong, { color: theme.text }]}>
                {task.name}
              </Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                {task.action === "skipped"
                  ? "省略"
                  : `${task.plannedDurationMin}分${task.action === "compressed" ? "（短縮）" : ""}`}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={[styles.note, { color: theme.textSecondary }]}>
        タスクの完了操作と自動再計画は次の実装段階で追加します。この画面は再起動しても同じセッションを復元します。
      </Text>
      <AppButton
        label="ホームへ戻る"
        onPress={onBackHome}
        variant="secondary"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", gap: spacing.lg },
  heading: { gap: spacing.xs },
  eyebrow: { ...typography.label },
  headingText: { ...typography.heading },
  summary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  currentTask: {
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  status: { borderRadius: radius.card, padding: spacing.lg },
  statusText: { ...typography.bodyStrong },
  adjustments: {
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  taskList: { gap: spacing.sm },
  taskRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  taskNumber: { ...typography.bodyStrong, width: 24 },
  taskContent: { flex: 1 },
  label: { ...typography.label },
  title: { ...typography.title },
  time: { ...typography.display },
  body: { ...typography.body },
  bodyStrong: { ...typography.bodyStrong },
  note: { ...typography.body },
});
