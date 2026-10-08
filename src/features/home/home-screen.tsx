import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import type { HomeDashboardData } from "@/application/home";
import { AppButton, ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { radius, spacing, typography } from "@/theme";

import {
  formatPlanDate,
  formatPlanTime,
  getRouteModeLabel,
} from "./home-plan-formatters";

type Props = Readonly<{
  loadPlan: () => Promise<HomeDashboardData>;
  onEditTomorrow: (targetDate: string) => void;
  onStartMorning: (sessionId: string) => void;
}>;

type ViewState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "ready"; plan: HomeDashboardData }>
  | Readonly<{ kind: "error" }>;

export function HomeScreen({
  loadPlan,
  onEditTomorrow,
  onStartMorning,
}: Props) {
  const theme = useTheme();
  const [viewState, setViewState] = useState<ViewState>({ kind: "loading" });
  const [requestNumber, setRequestNumber] = useState(0);

  const retry = useCallback(() => {
    setViewState({ kind: "loading" });
    setRequestNumber((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    void loadPlan()
      .then((plan) => {
        if (active) setViewState({ kind: "ready", plan });
      })
      .catch(() => {
        if (active) setViewState({ kind: "error" });
      });
    return () => {
      active = false;
    };
  }, [loadPlan, requestNumber]);

  if (viewState.kind === "loading") {
    return (
      <ScreenContainer scrollable={false}>
        <View
          accessibilityLabel="明日の予定を読み込み中"
          style={styles.centered}
        >
          <ActivityIndicator color={theme.primary} size="large" />
          <Text
            maxFontSizeMultiplier={1.8}
            style={[styles.body, { color: theme.textSecondary }]}
          >
            明日の予定を確認しています
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (viewState.kind === "error") {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.centered}>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: theme.text }]}
          >
            明日の予定を読み込めませんでした
          </Text>
          <Text
            accessibilityRole="alert"
            maxFontSizeMultiplier={1.8}
            style={[styles.body, { color: theme.textSecondary }]}
          >
            保存された設定は消えていません。通信は使わず、端末内のデータをもう一度読み込みます。
          </Text>
          <AppButton label="もう一度試す" onPress={retry} />
        </View>
      </ScreenContainer>
    );
  }

  const { plan } = viewState;
  if (plan.kind === "morningSession") {
    const isActive = plan.session.status === "active";
    return (
      <ScreenContainer>
        <View style={styles.heading}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>
            今日の朝ナビ
          </Text>
          <Text
            accessibilityRole="header"
            style={[styles.headingText, { color: theme.text }]}
          >
            {formatPlanDate(plan.session.targetDate, plan.timeZone)}
          </Text>
        </View>
        <View
          style={[
            styles.morningCallout,
            { backgroundColor: theme.successContainer },
          ]}
        >
          <Text style={[styles.label, { color: theme.success }]}>
            {isActive ? "進行中の朝プランがあります" : "朝の予定を始められます"}
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            {formatPlanTime(plan.session.firstEventStartAt, plan.timeZone)}　
            {plan.session.firstEventTitle}
          </Text>
          <Text
            maxFontSizeMultiplier={1.8}
            style={[styles.body, { color: theme.textSecondary }]}
          >
            アプリを閉じても、完了したタスクを保ったまま続きから再開します。
          </Text>
        </View>
        <AppButton
          label={isActive ? "朝プランを再開" : "朝の予定を始める"}
          onPress={() => onStartMorning(plan.session.id)}
        />
      </ScreenContainer>
    );
  }
  if (plan.kind === "noSchedule") {
    return (
      <ScreenContainer>
        <View style={styles.heading}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>
            明日の朝ナビ
          </Text>
          <Text
            accessibilityRole="header"
            style={[styles.headingText, { color: theme.text }]}
          >
            {formatPlanDate(plan.targetDate, plan.timeZone)}
          </Text>
        </View>
        <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: theme.text }]}
          >
            明日の予定はありません
          </Text>
          <Text
            maxFontSizeMultiplier={1.8}
            style={[styles.body, { color: theme.textSecondary }]}
          >
            休講・休日として登録されているか、この曜日の時間割が未設定です。
          </Text>
        </View>
        <AppButton
          label="明日の予定を変更"
          onPress={() => onEditTomorrow(plan.targetDate)}
          variant="secondary"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: theme.primary }]}>
          明日の朝ナビ
        </Text>
        <View style={styles.headingLine}>
          <Text
            accessibilityRole="header"
            style={[styles.headingText, { color: theme.text }]}
          >
            {formatPlanDate(plan.targetDate, plan.timeZone)}
          </Text>
          {plan.source === "override" ? (
            <View
              style={[
                styles.badge,
                { backgroundColor: theme.warningContainer },
              ]}
            >
              <Text style={[styles.badgeText, { color: theme.warning }]}>
                例外予定
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.planSurface,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.eventSection}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            最初の予定
          </Text>
          <Text style={[styles.eventTitle, { color: theme.text }]}>
            {formatPlanTime(plan.firstEvent.startAt, plan.timeZone)}　
            {plan.firstEvent.title}
          </Text>
          {plan.firstEvent.locationLabel ? (
            <Text
              maxFontSizeMultiplier={1.8}
              style={[styles.body, { color: theme.textSecondary }]}
            >
              {plan.firstEvent.locationLabel}
            </Text>
          ) : null}
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.timeColumns}>
          <PlanTime
            label="起きる目安"
            value={formatPlanTime(
              plan.basePlan.recommendedWakeAt,
              plan.timeZone,
            )}
          />
          <View
            style={[styles.columnDivider, { backgroundColor: theme.border }]}
          />
          <PlanTime
            label="家を出る目安"
            value={formatPlanTime(
              plan.basePlan.latestDepartureAt,
              plan.timeZone,
            )}
          />
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <DetailRow
          label="朝の準備"
          value={`${plan.basePlan.normalMorningDurationMin}分`}
        />
        <DetailRow
          label="通学時間"
          value={`${plan.basePlan.routeDurationMin}分`}
        />
      </View>

      <View style={styles.routeSection}>
        <Text style={[styles.title, { color: theme.text }]}>
          {plan.routeName}
        </Text>
        {plan.routeSegments.map((segment) => (
          <View key={segment.id} style={styles.routeRow}>
            <Text style={[styles.routeMode, { color: theme.primary }]}>
              {getRouteModeLabel(segment.mode)}
            </Text>
            <Text
              maxFontSizeMultiplier={1.8}
              style={[styles.routeDescription, { color: theme.textSecondary }]}
            >
              {segment.fromLabel} → {segment.toLabel}・{segment.durationMin}分
            </Text>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.alarmNotice,
          { backgroundColor: theme.warningContainer },
        ]}
      >
        <Text style={[styles.label, { color: theme.warning }]}>
          起床通知は未予約です
        </Text>
        <Text
          maxFontSizeMultiplier={1.8}
          style={[styles.body, { color: theme.text }]}
        >
          通知の自動予約は次の実装段階で追加します。現在は表示時刻を目安にしてください。
        </Text>
      </View>

      <AppButton
        label="明日の予定を変更"
        onPress={() => onEditTomorrow(plan.targetDate)}
        variant="secondary"
      />
    </ScreenContainer>
  );
}

function PlanTime({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  const theme = useTheme();
  return (
    <View style={styles.timeColumn}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1.4}
        numberOfLines={1}
        style={[styles.timeValue, { color: theme.text }]}
      >
        {value}
      </Text>
    </View>
  );
}

function DetailRow({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  const theme = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text
        maxFontSizeMultiplier={1.8}
        style={[styles.body, { color: theme.textSecondary }]}
      >
        {label}
      </Text>
      <Text
        maxFontSizeMultiplier={1.8}
        style={[styles.bodyStrong, { color: theme.text }]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", gap: spacing.lg },
  heading: { gap: spacing.xs },
  headingLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  eyebrow: { ...typography.label },
  headingText: { ...typography.heading, flexShrink: 1 },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: { ...typography.caption, fontWeight: "700" },
  planSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.card,
    overflow: "hidden",
    padding: spacing.xl,
    gap: spacing.lg,
  },
  eventSection: { gap: spacing.xs },
  label: { ...typography.label },
  title: { ...typography.title },
  eventTitle: { ...typography.title },
  body: { ...typography.body },
  bodyStrong: { ...typography.bodyStrong },
  divider: { height: StyleSheet.hairlineWidth },
  timeColumns: { flexDirection: "row", alignItems: "stretch", gap: spacing.lg },
  timeColumn: { flex: 1, gap: spacing.xs },
  columnDivider: { width: StyleSheet.hairlineWidth },
  timeValue: { ...typography.display },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  routeSection: { gap: spacing.md },
  routeRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  routeMode: { ...typography.label, width: 52 },
  routeDescription: { ...typography.body, flex: 1 },
  alarmNotice: {
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  morningCallout: {
    borderRadius: radius.card,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  emptyState: {
    borderRadius: radius.card,
    padding: spacing.xxl,
    gap: spacing.md,
  },
});
