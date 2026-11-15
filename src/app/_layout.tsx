import { useEffect } from "react";
import {
  DarkTheme,
  DefaultTheme,
  router,
  Stack,
  ThemeProvider,
} from "expo-router";
import { useColorScheme } from "react-native";

import { configureExpoNotificationPresentation } from "@/infrastructure/notifications/configure-notification-presentation";
import { observeMorningAlarmResponses } from "@/infrastructure/notifications/observe-morning-alarm-responses";

configureExpoNotificationPresentation();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useEffect(
    () =>
      observeMorningAlarmResponses((sessionId) => {
        router.push({ pathname: "/morning/start", params: { sessionId } });
      }),
    [],
  );
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
