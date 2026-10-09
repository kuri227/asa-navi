import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { radius, spacing, typography } from "@/theme";

type Props = Readonly<{
  adjustmentTexts: readonly string[];
  predictedDepartureText: string;
  accepted: boolean;
  onAccept: () => void;
}>;

export function RecoveryPlanCard({
  adjustmentTexts,
  predictedDepartureText,
  accepted,
  onAccept,
}: Props) {
  const theme = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.container, { backgroundColor: theme.warningContainer }]}
    >
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: theme.warning }]}
      >
        {accepted ? "このリカバリープランで進行中" : "遅れを取り戻すプラン"}
      </Text>
      {adjustmentTexts.map((text) => (
        <Text key={text} style={[styles.body, { color: theme.text }]}>
          ・{text}
        </Text>
      ))}
      <Text style={[styles.bodyStrong, { color: theme.text }]}>
        このプランなら{predictedDepartureText}に出発できます
      </Text>
      {!accepted ? (
        <AppButton label="このプランで進む" onPress={onAccept} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: { ...typography.title },
  body: { ...typography.body },
  bodyStrong: { ...typography.bodyStrong },
});
