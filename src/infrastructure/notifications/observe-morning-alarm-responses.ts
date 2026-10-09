import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

type NotificationResponseSnapshot = Readonly<{
  data: unknown;
}>;

type NotificationResponseSubscription = Readonly<{
  remove: () => void;
}>;

export type NotificationResponseGateway = Readonly<{
  getLastResponse: () => NotificationResponseSnapshot | null;
  clearLastResponse: () => void;
  addResponseListener: (
    listener: (response: NotificationResponseSnapshot) => void,
  ) => NotificationResponseSubscription;
}>;

const expoGateway: NotificationResponseGateway = {
  getLastResponse: () => {
    const response = Notifications.getLastNotificationResponse();
    return response ? toSnapshot(response) : null;
  },
  clearLastResponse: () => Notifications.clearLastNotificationResponse(),
  addResponseListener: (listener) =>
    Notifications.addNotificationResponseReceivedListener((response) =>
      listener(toSnapshot(response)),
    ),
};

export function observeMorningAlarmResponses(
  openMorningSession: (sessionId: string) => void,
  gateway: NotificationResponseGateway = expoGateway,
  platform: string = Platform.OS,
): () => void {
  if (platform === "web") return () => undefined;

  const lastResponse = gateway.getLastResponse();
  if (lastResponse) {
    openResponse(lastResponse, openMorningSession);
    gateway.clearLastResponse();
  }

  const subscription = gateway.addResponseListener((response) => {
    openResponse(response, openMorningSession);
  });
  return () => subscription.remove();
}

export function getMorningAlarmSessionId(data: unknown): string | null {
  if (!isRecord(data) || data.type !== "morning-alarm") return null;
  if (typeof data.sessionId !== "string") return null;
  const sessionId = data.sessionId.trim();
  return sessionId.length > 0 ? sessionId : null;
}

function openResponse(
  response: NotificationResponseSnapshot,
  openMorningSession: (sessionId: string) => void,
): void {
  const sessionId = getMorningAlarmSessionId(response.data);
  if (sessionId) openMorningSession(sessionId);
}

function toSnapshot(
  response: Notifications.NotificationResponse,
): NotificationResponseSnapshot {
  return { data: response.notification.request.content.data };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
