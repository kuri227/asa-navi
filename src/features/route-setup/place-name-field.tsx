import { useRef, type ComponentRef } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextInput,
} from "react-native";

import { TextField } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { layout, spacing, typography } from "@/theme";

import { findDraftPlaceMatches } from "./route-setup-model";

type PlaceNameFieldProps = Readonly<{
  label: string;
  placeholder: string;
  value: string;
  errorMessage?: string;
  previousDestination?: string;
  placeLabels: readonly string[];
  onChangeText: (value: string) => void;
}>;

export function PlaceNameField({
  label,
  placeholder,
  value,
  errorMessage,
  previousDestination,
  placeLabels,
  onChangeText,
}: PlaceNameFieldProps) {
  const theme = useTheme();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const previous = !value.trim() ? previousDestination?.trim() : undefined;
  const matches = previous
    ? [previous]
    : findDraftPlaceMatches(value, placeLabels);

  return (
    <View style={styles.field}>
      <TextField
        errorMessage={errorMessage}
        label={label}
        onChangeText={onChangeText}
        placeholder={placeholder}
        ref={inputRef}
        required
        value={value}
      />
      {matches.length > 0 ? (
        <View>
          <Text style={[styles.caption, { color: theme.textSecondary }]}>
            {previous ? "前の区間の終点" : "入力済みの場所"}
          </Text>
          {matches.map((name) => (
            <Pressable
              accessibilityLabel={`${label}に「${name}」を入力`}
              accessibilityRole="button"
              key={name}
              onPress={() => {
                onChangeText(name);
                if (Platform.OS === "web") inputRef.current?.focus();
              }}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: pressed ? theme.surfaceSelected : undefined,
                  borderTopColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.name, { color: theme.primary }]}>
                {name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  caption: { ...typography.label, paddingBottom: spacing.xxs },
  option: {
    borderTopWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: layout.minimumTouchTarget,
    paddingVertical: spacing.sm,
  },
  name: { ...typography.bodyStrong },
});
