import { useCallback } from "react";
import { router, useLocalSearchParams } from "expo-router";

import { MorningStartScreen } from "@/features/morning-session/morning-start-screen";
import { startMorningSessionFromDatabase } from "@/infrastructure/app-services/morning-session";

export default function MorningStartRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const id = typeof sessionId === "string" ? sessionId : "";
  const startSession = useCallback(
    () => startMorningSessionFromDatabase(id),
    [id],
  );
  return (
    <MorningStartScreen
      onBackHome={() => router.replace("/home")}
      startSession={startSession}
      timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"}
    />
  );
}
