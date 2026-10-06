import { Platform } from "react-native";

export const layout = {
  minimumTouchTarget: 48,
  maxContentWidth: 640,
  bottomNavigationInset: Platform.select({ ios: 50, android: 80 }) ?? 0,
} as const;
