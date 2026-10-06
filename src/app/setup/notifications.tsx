import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { spacing, typography } from "@/theme";

export default function NotificationSetupRoute() {
  const theme = useTheme();
  return (
    <ScreenContainer>
      <View style={styles.copy}>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.6}
          style={[styles.title, { color: theme.text }]}
        >
          通知の準備
        </Text>
        <Text
          maxFontSizeMultiplier={1.8}
          style={[styles.description, { color: theme.textSecondary }]}
        >
          次のセクションで、通知を使う理由を確認してから権限を設定します。
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  copy: { gap: spacing.lg },
  title: { ...typography.heading },
  description: { ...typography.body },
});
