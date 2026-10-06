import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { NotificationError } from "@/application/errors/notification-error";
import type {
  AlarmPermissionService,
  AlarmPermissionState,
} from "@/application/ports/notifications";

type PermissionResponse = Readonly<{
  status: "granted" | "denied" | "undetermined";
  granted: boolean;
  ios?: Readonly<{ status: Notifications.IosAuthorizationStatus }>;
}>;

type NotificationPermissionGateway = Readonly<{
  getPermissions: () => Promise<PermissionResponse>;
  requestPermissions: () => Promise<PermissionResponse>;
  prepareAndroidChannel: () => Promise<void>;
}>;

const expoGateway: NotificationPermissionGateway = {
  getPermissions: () => Notifications.getPermissionsAsync(),
  requestPermissions: () =>
    Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    }),
  prepareAndroidChannel: async () => {
    await Notifications.setNotificationChannelAsync("morning-alarm", {
      name: "朝ナビのアラーム",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    });
  },
};

export class ExpoNotificationPermissionService implements AlarmPermissionService {
  constructor(
    private readonly gateway: NotificationPermissionGateway = expoGateway,
    private readonly platform: string = Platform.OS,
  ) {}

  async getPermissionState(): Promise<AlarmPermissionState> {
    if (this.platform === "web") return "denied";
    try {
      return mapPermissionState(await this.gateway.getPermissions());
    } catch (error) {
      throw new NotificationError("通知の権限状態を確認できませんでした。", {
        cause: error,
      });
    }
  }

  async requestPermission(): Promise<AlarmPermissionState> {
    if (this.platform === "web") return "denied";
    try {
      if (this.platform === "android") {
        await this.gateway.prepareAndroidChannel();
      }
      return mapPermissionState(await this.gateway.requestPermissions());
    } catch (error) {
      throw new NotificationError("通知権限を設定できませんでした。", {
        cause: error,
      });
    }
  }
}

function mapPermissionState(
  response: PermissionResponse,
): AlarmPermissionState {
  if (
    response.granted ||
    response.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    response.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  ) {
    return "granted";
  }
  return response.status === "undetermined" ? "notDetermined" : "denied";
}
