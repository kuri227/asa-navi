import { Image } from "expo-image";

const startupMark = require("../../../assets/images/startup-mark.png");

export function StartupMark({ size }: Readonly<{ size: number }>) {
  return (
    <Image
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      contentFit="contain"
      source={startupMark}
      style={{ width: size, height: size }}
    />
  );
}
