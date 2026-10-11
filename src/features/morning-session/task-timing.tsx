import { useEffect, useState } from "react";
import { AppState, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { spacing, typography } from "@/theme";
import { formatPlanTime } from "../home/home-plan-formatters";

const TICK_INTERVAL_MS = 1000;
const MILLISECONDS_PER_MINUTE = 60_000;

type Props = Readonly<{
  startedAt: Date;
  durationMin: number;
  latestDepartureAt: Date;
  timeZone: string;
}>;

export function TaskTiming({
  startedAt,
  durationMin,
  latestDepartureAt,
  timeZone,
}: Props) {
  const theme = useTheme();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    let timer: ReturnType<typeof setInterval> | undefined;
    const pause = () => {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    };
    const resume = () => {
      pause();
      tick();
      timer = setInterval(tick, TICK_INTERVAL_MS);
    };
    if (AppState.currentState === "active" || AppState.currentState === null) {
      timer = setInterval(tick, TICK_INTERVAL_MS);
    }
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") resume();
      else pause();
    });
    return () => {
      pause();
      subscription.remove();
    };
  }, []);

  const taskRemainingMs =
    startedAt.getTime() + durationMin * MILLISECONDS_PER_MINUTE - now.getTime();
  const departureRemainingMs = latestDepartureAt.getTime() - now.getTime();
  const exceeded = taskRemainingMs < 0;
  return (
    <View style={styles.container}>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        現在時刻 {formatPlanTime(now, timeZone)}
      </Text>
      <Text
        style={[
          styles.label,
          { color: exceeded ? theme.error : theme.textSecondary },
        ]}
      >
        {exceeded ? "タスクの目安を超過" : "タスクの残り時間"}
      </Text>
      <Text
        accessibilityLabel={`${exceeded ? "目安超過" : "残り"} ${formatCountdown(taskRemainingMs)}`}
        style={[
          styles.countdown,
          { color: exceeded ? theme.error : theme.text },
        ]}
      >
        {formatCountdown(taskRemainingMs)}
      </Text>
      <Text
        style={[
          styles.body,
          {
            color: departureRemainingMs < 0 ? theme.error : theme.textSecondary,
          },
        ]}
      >
        {departureRemainingMs < 0 ? "最終出発時刻を超過" : "最終出発まで"}{" "}
        {formatCountdown(departureRemainingMs)}
      </Text>
    </View>
  );
}

export function formatCountdown(milliseconds: number): string {
  const seconds = Math.ceil(Math.abs(milliseconds) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs, paddingVertical: spacing.sm },
  body: { ...typography.body },
  label: { ...typography.label },
  countdown: { ...typography.display, fontVariant: ["tabular-nums"] },
});
