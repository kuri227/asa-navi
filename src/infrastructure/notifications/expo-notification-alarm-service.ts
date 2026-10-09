import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { NotificationError } from "@/application/errors/notification-error";
import type {
  AlarmPermissionService,
  AlarmPermissionState,
  AlarmScheduleInput,
  AlarmService,
} from "@/application/ports/notifications";

import { ExpoNotificationPermissionService } from "./expo-notification-permission-service";

const MORNING_ALARM_CHANNEL_ID = "morning-alarm";

type NotificationGateway = Readonly<{
  schedule: (
    request: Notifications.NotificationRequestInput,
  ) => Promise<string>;
  cancel: (notificationId: string) => Promise<void>;
}>;

const expoGateway: NotificationGateway = {
  schedule: (request) => Notifications.scheduleNotificationAsync(request),
  cancel: (notificationId) =>
    Notifications.cancelScheduledNotificationAsync(notificationId),
};

export class ExpoNotificationAlarmService implements AlarmService {
  constructor(
    private readonly gateway: NotificationGateway = expoGateway,
    private readonly permissionService: AlarmPermissionService = new ExpoNotificationPermissionService(),
    private readonly platform: string = Platform.OS,
  ) {}

  async schedule(input: AlarmScheduleInput): Promise<{ alarmId: string }> {
    if (this.platform === "web") {
      throw new NotificationError(
        "Webでは起床通知を予約できません。iOSまたはAndroidでお試しください。",
      );
    }
    try {
      const alarmId = await this.gateway.schedule({
        content: {
          title: input.title,
          body: input.body,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: {
            type: "morning-alarm",
            sessionId: input.sessionId,
            url: `/morning/start?sessionId=${encodeURIComponent(input.sessionId)}`,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: input.fireAt,
          channelId: MORNING_ALARM_CHANNEL_ID,
        },
      });
      return { alarmId };
    } catch (error) {
      throw new NotificationError("起床通知を予約できませんでした。", {
        cause: error,
      });
    }
  }

  async cancel(alarmId: string): Promise<void> {
    if (this.platform === "web") return;
    try {
      await this.gateway.cancel(alarmId);
    } catch (error) {
      throw new NotificationError("起床通知を取り消せませんでした。", {
        cause: error,
      });
    }
  }

  requestPermission(): Promise<AlarmPermissionState> {
    return this.permissionService.requestPermission();
  }

  getPermissionState(): Promise<AlarmPermissionState> {
    return this.permissionService.getPermissionState();
  }
}
