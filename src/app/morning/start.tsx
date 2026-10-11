import { useCallback } from "react";
import { router, useLocalSearchParams } from "expo-router";

import { MorningStartScreen } from "@/features/morning-session/morning-start-screen";
import { useScreenRefresh } from "@/hooks/use-screen-refresh";
import {
  completeMorningTaskInDatabase,
  skipOptionalMorningTaskInDatabase,
  startMorningSessionFromDatabase,
} from "@/infrastructure/app-services/morning-session";

export default function MorningStartRoute() {
  const refreshVersion = useScreenRefresh();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const id = typeof sessionId === "string" ? sessionId : "";
  const startSession = useCallback(
    () => startMorningSessionFromDatabase(id),
    [id],
  );
  const completeTask = useCallback(
    (executionId: string) => completeMorningTaskInDatabase(id, executionId),
    [id],
  );
  const skipTask = useCallback(
    (executionId: string) => skipOptionalMorningTaskInDatabase(id, executionId),
    [id],
  );
  return (
    <MorningStartScreen
      key={id}
      refreshVersion={refreshVersion}
      completeTask={completeTask}
      onBackHome={() => router.replace("/home")}
      skipTask={skipTask}
      startSession={startSession}
      timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"}
    />
  );
}
