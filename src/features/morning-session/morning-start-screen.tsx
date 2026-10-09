import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import type { ActiveMorningSession } from "@/application/morning-session";
import { AppButton, ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { radius, spacing, typography } from "@/theme";

import { formatPlanTime } from "../home/home-plan-formatters";
import { DepartureChecklist } from "./departure-checklist";
import {
  getAdjustmentText,
  getPlanStatusMessage,
  getWakeTimingMessage,
} from "./morning-plan-presenter";
import { RecoveryPlanCard } from "./recovery-plan-card";

type Props = Readonly<{
  timeZone: string;
  startSession: () => Promise<ActiveMorningSession>;
  completeTask: (executionId: string) => Promise<ActiveMorningSession>;
  skipTask: (executionId: string) => Promise<ActiveMorningSession>;
  onBackHome: () => void;
}>;

type ViewState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "ready"; value: ActiveMorningSession }>
  | Readonly<{ kind: "error" }>;

export function MorningStartScreen({
  timeZone,
  startSession,
  completeTask,
  skipTask,
  onBackHome,
}: Props) {
  const theme = useTheme();
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [requestNumber, setRequestNumber] = useState(0);
  const [actionKind, setActionKind] = useState<"complete" | "skip" | null>(
    null,
  );
  const [actionError, setActionError] = useState(false);
  const [acceptedRecoveryPlanKey, setAcceptedRecoveryPlanKey] = useState<
    string | null
  >(null);
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
  const allTasksFinished =
    value.session.status === "completed" || currentTask === undefined;
  const currentTaskIsOptional = currentTask
    ? value.optionalTaskIds.includes(currentTask.taskTemplateId)
    : false;
  const recoveryPlanKey = [
    currentTask?.id ?? "finished",
    value.plan.predictedDepartureAt.toISOString(),
    ...adjustmentTexts,
  ].join(":");
  const needsRecoveryConfirmation =
    adjustmentTexts.length > 0 && acceptedRecoveryPlanKey !== recoveryPlanKey;
  const performTaskAction = async (
    action: (executionId: string) => Promise<ActiveMorningSession>,
    kind: "complete" | "skip",
  ) => {
    if (!currentTask || actionKind) return;
    setActionKind(kind);
    setActionError(false);
    try {
      const nextValue = await action(currentTask.id);
      setState({ kind: "ready", value: nextValue });
    } catch {
      setActionError(true);
    } finally {
      setActionKind(null);
    }
  };
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
      {adjustmentTexts.length > 0 ? (
        <RecoveryPlanCard
          accepted={!needsRecoveryConfirmation}
          adjustmentTexts={adjustmentTexts}
          onAccept={() => setAcceptedRecoveryPlanKey(recoveryPlanKey)}
          predictedDepartureText={formatPlanTime(
            value.plan.predictedDepartureAt,
            timeZone,
          )}
        />
      ) : null}
      {!needsRecoveryConfirmation ? (
        <View
          style={[
            styles.currentTask,
            { backgroundColor: theme.successContainer },
          ]}
        >
          <Text style={[styles.label, { color: theme.success }]}>
            {allTasksFinished ? "朝の準備" : "今すること"}
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            {allTasksFinished
              ? "朝の準備が完了しました"
              : (taskName ?? "次のタスクを確認しています")}
          </Text>
          {currentTask ? (
            <>
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                目安 {currentTask.plannedDurationMin}分
              </Text>
              {actionError ? (
                <Text
                  accessibilityRole="alert"
                  style={[styles.body, { color: theme.error }]}
                >
                  進捗を保存できませんでした。もう一度お試しください。
                </Text>
              ) : null}
              <View style={styles.taskActions}>
                <AppButton
                  label="完了しました"
                  loading={actionKind === "complete"}
                  disabled={actionKind !== null}
                  onPress={() =>
                    void performTaskAction(completeTask, "complete")
                  }
                />
                {currentTaskIsOptional ? (
                  <AppButton
                    label="このタスクを省略"
                    loading={actionKind === "skip"}
                    disabled={actionKind !== null}
                    onPress={() => void performTaskAction(skipTask, "skip")}
                    variant="ghost"
                  />
                ) : null}
              </View>
            </>
          ) : null}
        </View>
      ) : null}
      {allTasksFinished ? (
        <DepartureChecklist
          departureTimeText={formatPlanTime(
            value.plan.predictedDepartureAt,
            timeZone,
          )}
          firstEventTitle={value.session.firstEventTitle}
          onDepart={onBackHome}
        />
      ) : (
        <>
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
            完了・省略した進捗は端末に保存され、残り時間に合わせて朝プランを自動で組み直します。
          </Text>
          <AppButton
            label="ホームへ戻る"
            onPress={onBackHome}
            variant="secondary"
          />
        </>
      )}
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
  taskActions: { gap: spacing.sm, paddingTop: spacing.sm },
  status: { borderRadius: radius.card, padding: spacing.lg },
  statusText: { ...typography.bodyStrong },
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
