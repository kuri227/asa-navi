import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { spacing, typography } from "@/theme";

export type FormSectionProps = PropsWithChildren<
  Readonly<{
    title: string;
    description?: string;
  }>
>;

export function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.headingGroup}>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.6}
          style={[styles.title, { color: theme.text }]}
        >
          {title}
        </Text>
        {description ? (
          <Text
            maxFontSizeMultiplier={1.8}
            style={[styles.description, { color: theme.textSecondary }]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.xl,
  },
  headingGroup: {
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
  },
  description: {
    ...typography.body,
  },
  content: {
    gap: spacing.lg,
  },
});
