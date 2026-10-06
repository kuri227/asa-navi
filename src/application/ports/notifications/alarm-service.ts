export type AlarmPermissionState = "granted" | "denied" | "notDetermined";

export type AlarmScheduleInput = Readonly<{
  sessionId: string;
  fireAt: Date;
  title: string;
  body: string;
}>;

export interface AlarmService {
  schedule(input: AlarmScheduleInput): Promise<{ alarmId: string }>;
  cancel(alarmId: string): Promise<void>;
  requestPermission(): Promise<AlarmPermissionState>;
  getPermissionState(): Promise<AlarmPermissionState>;
}

export type AlarmPermissionService = Pick<
  AlarmService,
  "requestPermission" | "getPermissionState"
>;
