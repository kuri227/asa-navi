import { render } from "@testing-library/react-native";
import { Platform } from "react-native";

import { ReorderPanel } from "../reorder-panel";

jest.mock("react-native-safe-area-context", () => {
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return { SafeAreaProvider: View, SafeAreaView: View };
});

describe("ReorderPanel", () => {
  it.each(["ios", "android", "web"] as const)(
    "uses window-local insets only on native (%s)",
    async (platform) => {
      const override = jest.replaceProperty(Platform, "OS", platform);
      try {
        const screen = await render(
          <ReorderPanel
            initialItemId="first"
            items={[{ id: "first", label: "徒歩" }]}
            onClose={jest.fn()}
            onMove={jest.fn()}
            title="通学区間の順番"
          />,
        );
        expect(
          screen.getByRole("header", { name: "通学区間の順番" }),
        ).toBeTruthy();
        if (platform === "web") {
          expect(screen.queryByTestId("reorder-window-insets")).toBeNull();
        } else {
          expect(screen.getByTestId("reorder-window-insets")).toHaveTextContent(
            /通学区間の順番/,
          );
        }
      } finally {
        override.restore();
      }
    },
  );
});
