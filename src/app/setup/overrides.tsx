import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { spacing, typography } from "@/theme";

export default function OverridesSetupRoute() {
  const theme = useTheme();
  return (
    <ScreenContainer>
      <View style={styles.copy}>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: theme.text }]}
        >
          特別日・例外予定を追加
        </Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          休講や特別時間割など、通常と異なる日の予定を登録します。
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
