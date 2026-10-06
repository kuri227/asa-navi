import { router } from "expo-router";

import { NotificationSetupScreen } from "@/features/notification-setup/notification-setup-screen";
import {
  markOnboardingCompleted,
  requestAppNotificationPermission,
} from "@/infrastructure/app-services/notification-onboarding";

export default function NotificationSetupRoute() {
  return (
    <NotificationSetupScreen
      onComplete={markOnboardingCompleted}
      onCompleted={() => router.replace("/home")}
      onRequestPermission={requestAppNotificationPermission}
    />
  );
}
