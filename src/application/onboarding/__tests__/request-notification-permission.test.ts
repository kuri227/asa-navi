import { FakeAlarmService } from "@/application/ports/notifications/testing";

import { requestNotificationPermission } from "../request-notification-permission";

describe("requestNotificationPermission", () => {
  it.each(["granted", "denied", "notDetermined"] as const)(
    "returns the platform permission result: %s",
    async (permission) => {
      const service = new FakeAlarmService({
        initialPermissionState: "notDetermined",
        requestPermissionResult: permission,
      });

      await expect(requestNotificationPermission(service)).resolves.toBe(
        permission,
      );
      await expect(service.getPermissionState()).resolves.toBe(permission);
    },
  );
});
