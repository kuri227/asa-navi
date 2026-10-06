import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { spacing, typography } from "@/theme";

export default function RouteSetupRoute() {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <View style={styles.copy}>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.5}
          style={[styles.title, { color: theme.text }]}
        >
          通学ルートを設定しましょう
        </Text>
        <Text
          maxFontSizeMultiplier={1.8}
          style={[styles.description, { color: theme.textSecondary }]}
        >
          徒歩・電車・バスなど、通学に使う区間を順番に登録します。
        </Text>
      </View>
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
});
