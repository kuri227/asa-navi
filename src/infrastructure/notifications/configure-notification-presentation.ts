import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

type HandlerGateway = Readonly<{
  setHandler: (handler: Notifications.NotificationHandler) => void;
}>;

const expoGateway: HandlerGateway = {
  setHandler: (handler) => Notifications.setNotificationHandler(handler),
};

export function configureExpoNotificationPresentation(
  gateway: HandlerGateway = expoGateway,
  platform: string = Platform.OS,
): void {
  if (platform === "web") return;
  gateway.setHandler({
    handleNotification: async () => getMorningNotificationBehavior(),
  });
}

export function getMorningNotificationBehavior(): Notifications.NotificationBehavior {
  return {
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
  };
}
