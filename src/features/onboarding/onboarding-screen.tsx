import { StyleSheet, Text, View } from "react-native";

import { AppButton, ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { radius, spacing, typography } from "@/theme";

export type OnboardingScreenProps = Readonly<{
  onStart: () => void;
}>;

export function OnboardingScreen({ onStart }: OnboardingScreenProps) {
  const theme = useTheme();

  return (
    <ScreenContainer footer={<AppButton label="始める" onPress={onStart} />}>
      <View style={styles.copy}>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.5}
          style={[styles.title, { color: theme.text }]}
        >
          朝のバタバタ、{"\n"}もう終わりにしませんか？
        </Text>
        <Text
          maxFontSizeMultiplier={1.8}
          style={[styles.description, { color: theme.textSecondary }]}
        >
          通学ルートや時間割に合わせて、最適な起床・やるべきことを自動で提案します。
        </Text>
      </View>

      <View
        accessible
        accessibilityLabel="朝の予定を整えるイメージ"
        style={[styles.illustration, { backgroundColor: theme.surfaceSubtle }]}
      >
        <Text accessibilityElementsHidden style={styles.sun}>
          ☀️
        </Text>
        <View style={[styles.planCard, { backgroundColor: theme.surface }]}>
          <Text
            maxFontSizeMultiplier={1.5}
            style={[styles.planEyebrow, { color: theme.primary }]}
          >
            明日の朝
          </Text>
          <Text
            maxFontSizeMultiplier={1.5}
            style={[styles.planTime, { color: theme.text }]}
          >
            6:45 起床
          </Text>
          <Text
            maxFontSizeMultiplier={1.8}
            style={[styles.planCaption, { color: theme.textSecondary }]}
          >
            予定から逆算してご案内
          </Text>
        </View>
      </View>

      <Text
        maxFontSizeMultiplier={1.8}
        style={[styles.setupHint, { color: theme.textSecondary }]}
      >
        セットアップは約3分です
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  copy: {
    gap: spacing.lg,
  },
  title: {
    ...typography.heading,
  },
  description: {
    ...typography.body,
  },
  illustration: {
    flex: 1,
    minHeight: 260,
    borderRadius: radius.card,
    padding: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
  },
  sun: {
    fontSize: 64,
    lineHeight: 76,
  },
  planCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  planEyebrow: {
    ...typography.label,
  },
  planTime: {
    ...typography.title,
  },
  planCaption: {
    ...typography.caption,
  },
  setupHint: {
    ...typography.caption,
    textAlign: "center",
  },
});
