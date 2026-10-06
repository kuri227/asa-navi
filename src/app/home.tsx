import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { radius, spacing, typography } from "@/theme";

export default function HomeRoute() {
  const theme = useTheme();
  return (
    <ScreenContainer>
      <View style={[styles.hero, { backgroundColor: theme.successContainer }]}>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.6}
          style={[styles.title, { color: theme.success }]}
        >
          初期設定が完了しました
        </Text>
        <Text
          maxFontSizeMultiplier={1.8}
          style={[styles.body, { color: theme.text }]}
        >
          通学予定と朝のルーティンを保存しました。次のPhaseで、翌朝の計画をここに表示します。
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.card, padding: spacing.xxl, gap: spacing.md },
  title: { ...typography.title },
  body: { ...typography.body },
});
