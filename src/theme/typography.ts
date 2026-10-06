import { Platform, type TextStyle } from "react-native";

export const fonts = Platform.select({
  ios: {
    sans: "system-ui",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  android: {
    sans: "sans-serif",
    rounded: "sans-serif",
    mono: "monospace",
  },
  default: {
    sans: "system-ui",
    rounded: "system-ui",
    mono: "monospace",
  },
});

export const typography = {
  display: {
    fontFamily: fonts.rounded,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "700",
    letterSpacing: -0.72,
  },
  heading: {
    fontFamily: fonts.rounded,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    letterSpacing: -0.42,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  bodyStrong: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  caption: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
} satisfies Record<string, TextStyle>;

export type TypographyRole = keyof typeof typography;
