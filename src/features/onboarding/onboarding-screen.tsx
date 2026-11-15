import { StyleSheet, Text, View } from "react-native";

import { AppButton, ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { spacing, typography } from "@/theme";

import { StartupMark } from "./startup-mark";

type OnboardingScreenProps = Readonly<{ onStart: () => void }>;

const morningExample = [
  { time: "06:45", label: "起床" },
  { time: "08:05", label: "出発" },
  { time: "08:50", label: "1限" },
] as const;

export function OnboardingScreen({ onStart }: OnboardingScreenProps) {
  const theme = useTheme();

  return (
    <ScreenContainer
      centerContent
      footer={<AppButton label="始める" onPress={onStart} />}
    >
      <View style={styles.welcome}>
        <View style={styles.brand}>
          <StartupMark size={180} />
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: theme.text }]}
          >
            朝ナビ
          </Text>
        </View>

        <View style={styles.preview}>
          <Text style={[styles.previewTitle, { color: theme.textSecondary }]}>
            朝のプラン例
          </Text>
          {morningExample.map(({ time, label }, index) => (
            <View
              key={time}
              style={[styles.row, { borderTopColor: theme.border }]}
            >
              <View
                aria-hidden
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === 0 ? theme.primary : theme.borderStrong,
                  },
                ]}
              />
              <Text
                style={[
                  styles.time,
                  { color: index === 0 ? theme.primary : theme.text },
                ]}
              >
                {time}
              </Text>
              <Text style={[styles.event, { color: theme.text }]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  welcome: { alignItems: "center", gap: spacing.section },
  brand: { alignItems: "center" },
  title: { ...typography.display, textAlign: "center" },
  preview: { width: "100%", maxWidth: 360 },
  previewTitle: { ...typography.label, paddingBottom: spacing.sm },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: spacing.md,
    rowGap: spacing.xxs,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: spacing.sm, height: spacing.sm, borderRadius: spacing.xs },
  time: { ...typography.title, fontVariant: ["tabular-nums"] },
  event: { ...typography.bodyStrong },
});
