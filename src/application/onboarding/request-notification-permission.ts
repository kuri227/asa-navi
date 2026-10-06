import type {
  AlarmPermissionService,
  AlarmPermissionState,
} from "@/application/ports/notifications";

export function requestNotificationPermission(
  service: AlarmPermissionService,
): Promise<AlarmPermissionState> {
  return service.requestPermission();
}
