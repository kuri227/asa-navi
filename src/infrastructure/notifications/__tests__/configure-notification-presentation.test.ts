import {
  configureExpoNotificationPresentation,
  getMorningNotificationBehavior,
} from "../configure-notification-presentation";

jest.mock("expo-notifications", () => ({
  AndroidNotificationPriority: { MAX: "max" },
  setNotificationHandler: jest.fn(),
}));

describe("configureExpoNotificationPresentation", () => {
  it("registers a foreground handler on native platforms", () => {
    const setHandler = jest.fn();

    configureExpoNotificationPresentation({ setHandler }, "android");

    expect(setHandler).toHaveBeenCalledWith({
      handleNotification: expect.any(Function),
    });
    expect(getMorningNotificationBehavior()).toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: "max",
    });
  });

  it("does not register a native handler on web", () => {
    const setHandler = jest.fn();

    configureExpoNotificationPresentation({ setHandler }, "web");

    expect(setHandler).not.toHaveBeenCalled();
  });
});
