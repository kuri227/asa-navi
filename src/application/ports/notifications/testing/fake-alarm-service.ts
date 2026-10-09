import type {
  AlarmPermissionState,
  AlarmScheduleInput,
  AlarmService,
} from "../alarm-service";

export type ScheduledFakeAlarm = Readonly<{
  alarmId: string;
  input: AlarmScheduleInput;
}>;

type Options = Readonly<{
  initialPermissionState?: AlarmPermissionState;
  requestPermissionResult?: AlarmPermissionState;
  createAlarmId?: () => string;
}>;

export class FakeAlarmService implements AlarmService {
  private permissionState: AlarmPermissionState;
  private readonly requestPermissionResult: AlarmPermissionState;
  private readonly createAlarmId: () => string;
  private readonly scheduledById = new Map<string, AlarmScheduleInput>();
  private readonly cancelledIds: string[] = [];
  private nextAlarmNumber = 1;

  constructor(options: Options = {}) {
    this.permissionState = options.initialPermissionState ?? "notDetermined";
    this.requestPermissionResult =
      options.requestPermissionResult ?? this.permissionState;
    this.createAlarmId =
      options.createAlarmId ?? (() => `fake-alarm-${this.nextAlarmNumber++}`);
  }

  async schedule(input: AlarmScheduleInput): Promise<{ alarmId: string }> {
    const alarmId = this.createAlarmId();
    this.scheduledById.set(alarmId, input);
    return { alarmId };
  }

  async cancel(alarmId: string): Promise<void> {
    this.cancelledIds.push(alarmId);
    this.scheduledById.delete(alarmId);
  }

  async requestPermission(): Promise<AlarmPermissionState> {
    this.permissionState = this.requestPermissionResult;
    return this.permissionState;
  }

  async getPermissionState(): Promise<AlarmPermissionState> {
    return this.permissionState;
  }

  getScheduledAlarms(): readonly ScheduledFakeAlarm[] {
    return [...this.scheduledById.entries()].map(([alarmId, input]) => ({
      alarmId,
      input,
    }));
  }

  getCancelledAlarmIds(): readonly string[] {
    return [...this.cancelledIds];
  }
}
