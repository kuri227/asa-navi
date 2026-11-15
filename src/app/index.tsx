import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AppButton, ScreenContainer } from "@/components/ui";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
import { StartupMark } from "@/features/onboarding/startup-mark";
import { useTheme } from "@/hooks/use-theme";
import { loadOnboardingCompleted } from "@/infrastructure/app-services/notification-onboarding";
import { spacing, typography } from "@/theme";

type EntryState = "checking" | "onboarding" | "error";

export default function OnboardingRoute() {
  const theme = useTheme();
  const [state, setState] = useState<EntryState>("checking");

  const checkOnboarding = useCallback(() => {
    void loadOnboardingCompleted()
      .then((completed) => {
        if (completed) {
          router.replace("/home");
          return;
        }
        setState("onboarding");
      })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => {
    checkOnboarding();
  }, [checkOnboarding]);

  if (state === "checking") {
    return (
      <ScreenContainer centerContent>
        <View style={styles.loading}>
          <StartupMark size={132} />
          <ActivityIndicator
            accessibilityLabel="初期設定を確認中"
            color={theme.primary}
          />
        </View>
      </ScreenContainer>
    );
  }

  if (state === "error") {
    return (
      <ScreenContainer>
        <View style={styles.errorContent}>
          <Text
            accessibilityRole="alert"
            maxFontSizeMultiplier={1.8}
            style={[styles.error, { color: theme.error }]}
          >
            設定を読み込めませんでした。
          </Text>
          <AppButton
            label="もう一度試す"
            onPress={() => {
              setState("checking");
              checkOnboarding();
            }}
          />
        </View>
      </ScreenContainer>
    );
  }

  return <OnboardingScreen onStart={() => router.navigate("/setup/route")} />;
}

const styles = StyleSheet.create({
  loading: { alignItems: "center", gap: spacing.sm },
  errorContent: { gap: spacing.xl },
  error: { ...typography.bodyStrong },
});
