import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { RouteSetupScreen } from "../route-setup-screen";

describe("RouteSetupScreen", () => {
  it("adds and saves multiple transport segments in display order", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onSaved = jest.fn();
    const screen = await render(
      <RouteSetupScreen onSave={onSave} onSaved={onSaved} />,
    );

    await fireEvent.changeText(screen.getByLabelText("始点、必須"), "自宅");
    await fireEvent.changeText(screen.getByLabelText("終点、必須"), "吹田駅");
    await fireEvent.changeText(
      screen.getByLabelText("所要時間（分）、必須"),
      "8",
    );
    await fireEvent.press(screen.getByRole("button", { name: "区間を追加" }));

    const starts = screen.getAllByLabelText("始点、必須");
    const ends = screen.getAllByLabelText("終点、必須");
    const durations = screen.getAllByLabelText("所要時間（分）、必須");
    await fireEvent.press(screen.getAllByRole("radio", { name: "電車" })[1]);
    await fireEvent.changeText(starts[1], "吹田駅");
    await fireEvent.changeText(ends[1], "大阪駅");
    await fireEvent.changeText(
      screen.getAllByLabelText("路線名（任意）")[1],
      "JR京都線",
    );
    await fireEvent.changeText(durations[1], "12");
    await fireEvent.press(screen.getAllByRole("button", { name: "上へ" })[1]);
    await fireEvent.press(screen.getByRole("button", { name: "次へ" }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        name: "いつもの通学ルート",
        segments: [
          {
            mode: "train",
            fromLabel: "吹田駅",
            toLabel: "大阪駅",
            lineName: "JR京都線",
            durationMin: 12,
          },
          {
            mode: "walk",
            fromLabel: "自宅",
            toLabel: "吹田駅",
            lineName: "",
            durationMin: 8,
          },
        ],
      }),
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("keeps the user on the form and identifies invalid fields", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = await render(
      <RouteSetupScreen onSave={onSave} onSaved={jest.fn()} />,
    );

    await fireEvent.changeText(screen.getByLabelText("ルート名、必須"), "");
    await fireEvent.press(screen.getByRole("button", { name: "次へ" }));

    expect(
      screen.getByText("未入力または正しくない項目を確認してください。"),
    ).toBeTruthy();
    expect(screen.getByText("ルート名は必須です")).toBeTruthy();
    expect(screen.getByText("始点は必須です")).toBeTruthy();
    expect(screen.getByText("終点は必須です")).toBeTruthy();
    expect(screen.getByText("0〜1440の整数で入力してください")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });
});
