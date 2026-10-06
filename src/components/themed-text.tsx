import { Platform, StyleSheet, Text, type TextProps } from "react-native";

import type { ThemeColor } from "@/theme";
import { fonts, typography } from "@/theme";
import { useTheme } from "@/hooks/use-theme";

export type ThemedTextProps = TextProps & {
  type?:
    | "default"
    | "title"
    | "small"
    | "smallBold"
    | "subtitle"
    | "link"
    | "linkPrimary"
    | "code";
  themeColor?: ThemeColor;
};

export function ThemedText({
  style,
  type = "default",
  themeColor,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();
  const color =
    theme[themeColor ?? (type === "linkPrimary" ? "primary" : "text")];

  return (
    <Text
      style={[
        { color },
        type === "default" && styles.default,
        type === "title" && styles.title,
        type === "small" && styles.small,
        type === "smallBold" && styles.smallBold,
        type === "subtitle" && styles.subtitle,
        type === "link" && styles.link,
        type === "linkPrimary" && styles.linkPrimary,
        type === "code" && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    ...typography.label,
  },
  smallBold: {
    ...typography.label,
    fontWeight: "700",
  },
  default: {
    ...typography.body,
  },
  title: {
    ...typography.display,
  },
  subtitle: {
    ...typography.heading,
  },
  link: {
    ...typography.label,
  },
  linkPrimary: {
    ...typography.label,
  },
  code: {
    fontFamily: fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
