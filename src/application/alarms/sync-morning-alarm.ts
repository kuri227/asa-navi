import type {
  AlarmPermissionState,
  AlarmService,
} from "@/application/ports/notifications";
import type {
  AlarmRecord,
  AlarmRecordRepository,
  MorningSession,
} from "@/application/ports/repositories";

export type AlarmSyncState =
  "scheduled" | "notScheduled" | "permissionDenied" | "failed";

export type AlarmSyncResult = Readonly<{
  state: AlarmSyncState;
  record?: AlarmRecord;
}>;

type Dependencies = Readonly<{
  alarmService: AlarmService;
  alarmRecordRepository: AlarmRecordRepository;
  createId: () => string;
}>;

export async function syncMorningAlarm(
  input: Readonly<{ session: MorningSession; now: Date }>,
  dependencies: Dependencies,
): Promise<AlarmSyncResult> {
  const records = await dependencies.alarmRecordRepository.listBySessionId(
    input.session.id,
  );
  const scheduledRecords = records.filter(
    (record) => record.status === "scheduled",
  );
  if (
    input.session.status !== "planned" ||
    input.session.plannedWakeAt.getTime() <= input.now.getTime()
  ) {
    await cancelScheduledRecords(scheduledRecords, input.now, dependencies);
    return { state: "notScheduled" };
  }

  let permission: AlarmPermissionState;
  try {
    permission = await dependencies.alarmService.getPermissionState();
  } catch {
    return recordFailedAttempt(input, dependencies);
  }
  if (permission !== "granted") {
    await cancelScheduledRecords(scheduledRecords, input.now, dependencies);
    return { state: "permissionDenied" };
  }

  const reusableRecord = getReusableRecord(
    scheduledRecords,
    input.session.plannedWakeAt,
  );
  if (reusableRecord) return { state: "scheduled", record: reusableRecord };

  await cancelScheduledRecords(scheduledRecords, input.now, dependencies);
  return scheduleAndRecord(input, dependencies);
}

async function cancelScheduledRecords(
  records: readonly AlarmRecord[],
  now: Date,
  dependencies: Dependencies,
): Promise<void> {
  for (const record of records) {
    if (record.platformNotificationId) {
      await dependencies.alarmService.cancel(record.platformNotificationId);
    }
    await dependencies.alarmRecordRepository.save({
      ...record,
      status: "cancelled",
      updatedAt: now,
    });
  }
}

function getReusableRecord(
  records: readonly AlarmRecord[],
  plannedWakeAt: Date,
): AlarmRecord | undefined {
  if (records.length !== 1) return undefined;
  const [record] = records;
  if (
    !record.platformNotificationId ||
    record.scheduledAt.getTime() !== plannedWakeAt.getTime()
  ) {
    return undefined;
  }
  return record;
}

async function scheduleAndRecord(
  input: Readonly<{ session: MorningSession; now: Date }>,
  dependencies: Dependencies,
): Promise<AlarmSyncResult> {
  let alarmId: string;
  try {
    ({ alarmId } = await dependencies.alarmService.schedule({
      sessionId: input.session.id,
      fireAt: input.session.plannedWakeAt,
      title: "朝ナビ",
      body: `${input.session.firstEventTitle}の日です。朝の予定を始めましょう。`,
    }));
  } catch {
    return recordFailedAttempt(input, dependencies);
  }
  const record = createRecord(
    input,
    dependencies.createId(),
    "scheduled",
    alarmId,
  );
  try {
    await dependencies.alarmRecordRepository.create(record);
  } catch (saveError) {
    try {
      await dependencies.alarmService.cancel(alarmId);
    } catch (cancelError) {
      throw new AggregateError(
        [saveError, cancelError],
        "通知予約の保存と補償取消に失敗しました。",
      );
    }
    throw saveError;
  }
  return { state: "scheduled", record };
}

async function recordFailedAttempt(
  input: Readonly<{ session: MorningSession; now: Date }>,
  dependencies: Dependencies,
): Promise<AlarmSyncResult> {
  const record = createRecord(input, dependencies.createId(), "failed");
  await dependencies.alarmRecordRepository.create(record);
  return { state: "failed", record };
}

function createRecord(
  input: Readonly<{ session: MorningSession; now: Date }>,
  id: string,
  status: AlarmRecord["status"],
  platformNotificationId?: string,
): AlarmRecord {
  return {
    id,
    sessionId: input.session.id,
    scheduledAt: input.session.plannedWakeAt,
    platformNotificationId,
    status,
    createdAt: input.now,
    updatedAt: input.now,
  };
}
