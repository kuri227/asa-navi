/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { colorSchemes, fonts, layout, spacing } from "@/theme";

export const Colors = colorSchemes;
export type { ThemeColor } from "@/theme";
export const Fonts = fonts;

export const Spacing = {
  half: spacing.xxs,
  one: spacing.xs,
  two: spacing.sm,
  three: spacing.lg,
  four: spacing.xxl,
  five: spacing.xxxl,
  six: spacing.screen,
} as const;

export const BottomTabInset = layout.bottomNavigationInset;
export const MaxContentWidth = layout.maxContentWidth;
