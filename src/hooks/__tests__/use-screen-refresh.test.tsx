import { act, render } from "@testing-library/react-native";
import { AppState, Text, type AppStateStatus } from "react-native";
import { useFocusEffect } from "expo-router";
import { useScreenRefresh } from "../use-screen-refresh";

jest.mock("expo-router", () => ({ useFocusEffect: jest.fn() }));

function Probe() {
  return <Text>{useScreenRefresh()}</Text>;
}

it("refreshes on refocus and foreground once, and unsubscribes on blur", async () => {
  let changeState: (state: AppStateStatus) => void = () => undefined;
  const remove = jest.fn();
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_type, listener) => {
      changeState = listener;
      return { remove };
    });
  const screen = await render(<Probe />);
  const focus = jest.mocked(useFocusEffect).mock.calls[0][0];
  const lifecycle: { blur: ReturnType<typeof focus> } = { blur: undefined };
  await act(async () => {
    lifecycle.blur = focus();
  });
  expect(screen.getByText("0")).toBeTruthy();
  await act(async () => {
    changeState("background");
    changeState("active");
    changeState("active");
  });
  expect(screen.getByText("1")).toBeTruthy();
  if (lifecycle.blur) lifecycle.blur();
  expect(remove).toHaveBeenCalledTimes(1);
  await act(async () => {
    lifecycle.blur = focus();
  });
  expect(screen.getByText("2")).toBeTruthy();
  if (lifecycle.blur) lifecycle.blur();
  jest.restoreAllMocks();
});
