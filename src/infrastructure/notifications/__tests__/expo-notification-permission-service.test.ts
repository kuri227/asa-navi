import { NotificationError } from "@/application/errors/notification-error";

import { ExpoNotificationPermissionService } from "../expo-notification-permission-service";

jest.mock("expo-notifications", () => ({
  AndroidImportance: { MAX: 5 },
  IosAuthorizationStatus: { PROVISIONAL: 3, EPHEMERAL: 4 },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
}));

function createResponse(status: "granted" | "denied" | "undetermined") {
  return {
    status,
    granted: status === "granted",
    canAskAgain: status !== "denied",
    expires: "never" as const,
  };
}

describe("ExpoNotificationPermissionService", () => {
  it("prepares an Android channel before requesting permission", async () => {
    const calls: string[] = [];
    const service = new ExpoNotificationPermissionService(
      {
        getPermissions: jest.fn(),
        prepareAndroidChannel: jest.fn(async () => {
          calls.push("channel");
        }),
        requestPermissions: jest.fn(async () => {
          calls.push("request");
          return createResponse("granted");
        }),
      },
      "android",
    );

    await expect(service.requestPermission()).resolves.toBe("granted");
    expect(calls).toEqual(["channel", "request"]);
  });

  it("maps an undetermined permission without opening a prompt", async () => {
    const service = new ExpoNotificationPermissionService(
      {
        getPermissions: jest
          .fn()
          .mockResolvedValue(createResponse("undetermined")),
        prepareAndroidChannel: jest.fn(),
        requestPermissions: jest.fn(),
      },
      "ios",
    );
    await expect(service.getPermissionState()).resolves.toBe("notDetermined");
  });

  it("wraps native failures in NotificationError", async () => {
    const service = new ExpoNotificationPermissionService(
      {
        getPermissions: jest.fn(),
        prepareAndroidChannel: jest.fn(),
        requestPermissions: jest
          .fn()
          .mockRejectedValue(new Error("native failure")),
      },
      "ios",
    );
    await expect(service.requestPermission()).rejects.toBeInstanceOf(
      NotificationError,
    );
  });

  it("does not call native notification APIs on web", async () => {
    const requestPermissions = jest.fn();
    const service = new ExpoNotificationPermissionService(
      {
        getPermissions: jest.fn(),
        prepareAndroidChannel: jest.fn(),
        requestPermissions,
      },
      "web",
    );
    await expect(service.requestPermission()).resolves.toBe("denied");
    expect(requestPermissions).not.toHaveBeenCalled();
  });
});
