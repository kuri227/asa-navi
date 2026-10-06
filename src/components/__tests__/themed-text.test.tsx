import { render } from "@testing-library/react-native";

import { ThemedText } from "@/components/themed-text";

describe("ThemedText", () => {
  it("renders its child text", async () => {
    const { getByText } = await render(<ThemedText>朝ナビ</ThemedText>);

    expect(getByText("朝ナビ")).toBeTruthy();
  });
});
