import { useCallback } from "react";
import { router, useLocalSearchParams } from "expo-router";

import { TomorrowOverrideScreen } from "@/features/tomorrow-override/tomorrow-override-screen";
import {
  loadTomorrowOverrideFromDatabase,
  restoreTomorrowWeekdayScheduleInDatabase,
  saveTomorrowOverrideToDatabase,
} from "@/infrastructure/app-services/tomorrow-override";

export default function TomorrowOverrideRoute() {
  const { targetDate } = useLocalSearchParams<{ targetDate?: string }>();
  const date = typeof targetDate === "string" ? targetDate : "";
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const loadOverride = useCallback(
    () => loadTomorrowOverrideFromDatabase(date),
    [date],
  );
  return (
    <TomorrowOverrideScreen
      loadOverride={loadOverride}
      onDone={() => router.replace("/home")}
      onRestore={() => restoreTomorrowWeekdayScheduleInDatabase(date)}
      onSave={saveTomorrowOverrideToDatabase}
      targetDate={date}
      timeZone={timeZone}
    />
  );
}
