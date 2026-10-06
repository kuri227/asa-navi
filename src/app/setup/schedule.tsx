import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { spacing, typography } from "@/theme";

export default function ScheduleSetupRoute() {
  const theme = useTheme();
  return (
    <ScreenContainer>
      <View style={styles.copy}>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: theme.text }]}
        >
          曜日の予定を設定しましょう
        </Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          曜日ごとの最初の予定と開始時刻を登録します。
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
