import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { layout, radius, spacing, typography } from "@/theme";

export type TextFieldProps = Omit<
  TextInputProps,
  "accessibilityLabel" | "style"
> &
  Readonly<{
    label: string;
    helperText?: string;
    errorMessage?: string;
    required?: boolean;
  }>;

export function TextField({
  label,
  helperText,
  errorMessage,
  required = false,
  editable = true,
  multiline = false,
  onBlur,
  onFocus,
  ...inputProps
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const supportingText = errorMessage ?? helperText;
  const accessibilityLabel = required ? `${label}、必須` : label;

  return (
    <View style={styles.container}>
      <Text
        maxFontSizeMultiplier={1.6}
        style={[styles.label, { color: theme.text }]}
      >
        {label}
        {required ? "（必須）" : ""}
      </Text>
      <TextInput
        {...inputProps}
        accessibilityHint={supportingText}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !editable }}
        aria-invalid={Boolean(errorMessage)}
        editable={editable}
        multiline={multiline}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        placeholderTextColor={theme.textDisabled}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            backgroundColor: theme.surface,
            borderColor: errorMessage
              ? theme.error
              : focused
                ? theme.focus
                : theme.borderStrong,
            color: theme.text,
          },
          !editable && styles.disabled,
        ]}
      />
      {supportingText ? (
        <Text
          accessibilityLiveRegion={errorMessage ? "polite" : "none"}
          maxFontSizeMultiplier={1.8}
          style={[
            styles.supporting,
            { color: errorMessage ? theme.error : theme.textSecondary },
          ]}
        >
          {supportingText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
  },
  input: {
    ...typography.body,
    minHeight: layout.minimumTouchTarget,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  multiline: {
    minHeight: 112,
    textAlignVertical: "top",
  },
  supporting: {
    ...typography.caption,
  },
  disabled: {
    opacity: 0.48,
  },
});
