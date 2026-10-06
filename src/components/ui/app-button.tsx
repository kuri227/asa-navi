import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { layout, radius, spacing, typography } from "@/theme";

type AppButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

export type AppButtonProps = Readonly<{
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}>;

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  accessibilityHint,
  style,
}: AppButtonProps) {
  const theme = useTheme();
  const unavailable = disabled || loading;
  const foreground =
    variant === "primary"
      ? theme.onPrimary
      : variant === "destructive"
        ? theme.error
        : theme.primary;
  const background =
    variant === "primary"
      ? theme.primary
      : variant === "secondary"
        ? theme.surfaceSelected
        : "transparent";
  const pressedBackground =
    variant === "primary"
      ? theme.primaryPressed
      : variant === "destructive"
        ? theme.errorContainer
        : theme.surfaceSelected;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={loading ? `${label}、処理中` : label}
      accessibilityRole="button"
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? pressedBackground : background },
        variant !== "primary" && { borderColor: theme.borderStrong },
        unavailable && styles.unavailable,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <Text
          maxFontSizeMultiplier={1.6}
          style={[styles.label, { color: foreground }]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: layout.minimumTouchTarget,
    borderRadius: radius.control,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  label: {
    ...typography.bodyStrong,
    textAlign: "center",
  },
  unavailable: {
    opacity: 0.48,
  },
});
