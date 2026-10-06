import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AppButton, ScreenContainer } from "@/components/ui";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
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
      <ScreenContainer scrollable={false}>
        <ActivityIndicator
          accessibilityLabel="初期設定を確認中"
          color={theme.primary}
          size="large"
        />
      </ScreenContainer>
    );
  }

  if (state === "error") {
    return (
      <ScreenContainer scrollable={false}>
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
  errorContent: { gap: spacing.xl },
  error: { ...typography.bodyStrong },
});
