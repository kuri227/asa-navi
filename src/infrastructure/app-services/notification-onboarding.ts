import {
  completeOnboarding,
  requestNotificationPermission,
} from "@/application/onboarding";
import type { AlarmPermissionState } from "@/application/ports/notifications";
import { openAppDatabase } from "@/infrastructure/db/open-database";
import { createMutationDatabase } from "@/infrastructure/db/query-database";
import { SQLiteSettingsRepository } from "@/infrastructure/db/repositories";
import { ExpoNotificationPermissionService } from "@/infrastructure/notifications/expo-notification-permission-service";

export function requestAppNotificationPermission(): Promise<AlarmPermissionState> {
  return requestNotificationPermission(new ExpoNotificationPermissionService());
}

export async function markOnboardingCompleted(): Promise<void> {
  const database = await openAppDatabase();
  try {
    await completeOnboarding(
      new SQLiteSettingsRepository(createMutationDatabase(database)),
      () => new Date(),
    );
  } finally {
    await database.closeAsync();
  }
}

export async function loadOnboardingCompleted(): Promise<boolean> {
  const database = await openAppDatabase();
  try {
    const settings = await new SQLiteSettingsRepository(
      createMutationDatabase(database),
    ).get();
    return settings.onboardingCompleted;
  } finally {
    await database.closeAsync();
  }
}
