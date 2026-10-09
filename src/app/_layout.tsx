import { useEffect } from "react";
import {
  DarkTheme,
  DefaultTheme,
  router,
  Stack,
  ThemeProvider,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { configureExpoNotificationPresentation } from "@/infrastructure/notifications/configure-notification-presentation";
import { observeMorningAlarmResponses } from "@/infrastructure/notifications/observe-morning-alarm-responses";

configureExpoNotificationPresentation();

SplashScreen.preventAutoHideAsync();

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
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
