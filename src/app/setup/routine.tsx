import { StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { spacing, typography } from "@/theme";

export default function RoutineSetupRoute() {
  const theme = useTheme();
  return (
    <ScreenContainer>
      <View style={styles.copy}>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: theme.text }]}
        >
          朝のルーティンを設定しましょう
        </Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          朝食や身支度など、出発までに行うことを登録します。
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
