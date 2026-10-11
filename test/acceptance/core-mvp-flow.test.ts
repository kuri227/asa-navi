import { loadTomorrowPlan } from "@/application/tomorrow-plan";
import {
  createPlannedMorningSession,
  startMorningSession,
  completeMorningTask,
} from "@/application/morning-session";
import { syncMorningAlarm } from "@/application/alarms";
import { FakeAlarmService } from "@/application/ports/notifications/testing";
import type {
  AlarmRecord,
  AlarmRecordRepository,
  MorningSession,
  MorningSessionRepository,
  MorningTaskExecution,
  MorningTaskExecutionRepository,
  RouteWithSegments,
  RoutineRepository,
  ScheduleRepository,
  SettingsRepository,
} from "@/application/ports/repositories";
import type { MorningTaskTemplate } from "@/domain/planning";

it("plans the next morning, schedules one alarm, restores progress and finishes all tasks", async () => {
  const evening = new Date("2026-10-12T10:00:00Z");
  const sessionStore = new Map<string, MorningSession>();
  const executionStore = new Map<string, MorningTaskExecution>();
  const alarmStore = new Map<string, AlarmRecord>();
  let nextId = 0;
  const createId = () => `id-${++nextId}`;
  const sessionRepository: MorningSessionRepository = {
    create: async (session) => {
      sessionStore.set(session.id, session);
    },
    savePrepared: async (session) => {
      sessionStore.set(session.id, session);
    },
    findById: async (id) => sessionStore.get(id) ?? null,
    findActive: async (date) =>
      [...sessionStore.values()].find(
        (session) =>
          session.targetDate === date &&
          ["planned", "active"].includes(session.status),
      ) ?? null,
    start: async (id, now) => {
      const session = requireSession(id);
      sessionStore.set(id, {
        ...session,
        status: "active",
        actualWakeAt: session.actualWakeAt ?? now,
      });
    },
    savePlan: async (id, plan) => {
      sessionStore.set(id, {
        ...requireSession(id),
        predictedDepartureAt: plan.predictedDepartureAt,
        predictedArrivalAt: plan.predictedArrivalAt,
        latestDepartureAt: plan.latestDepartureAt,
        planStatus: plan.status,
        lateByMin: plan.lateByMin,
      });
    },
    updateStatus: async (id, status) => {
      sessionStore.set(id, { ...requireSession(id), status });
    },
  };
  function requireSession(id: string): MorningSession {
    const session = sessionStore.get(id);
    if (!session) throw new Error("Missing test session");
    return session;
  }
  const executionRepository: MorningTaskExecutionRepository = {
    replaceForSession: async (_id, executions) => {
      executions.forEach((execution) =>
        executionStore.set(execution.id, execution),
      );
    },
    listForSession: async (id) =>
      [...executionStore.values()].filter(
        (execution) => execution.sessionId === id,
      ),
    save: async (execution) => {
      executionStore.set(execution.id, execution);
    },
  };
  const alarmRecordRepository: AlarmRecordRepository = {
    create: async (record) => {
      alarmStore.set(record.id, record);
    },
    save: async (record) => {
      alarmStore.set(record.id, record);
    },
    listBySessionId: async (id) =>
      [...alarmStore.values()].filter((record) => record.sessionId === id),
  };
  const route: RouteWithSegments = {
    route: {
      id: "route",
      name: "通学",
      isActive: true,
      isDefault: true,
      createdAt: evening,
      updatedAt: evening,
    },
    segments: [8, 12, 6, 5].map((durationMin, sortOrder) => ({
      id: `segment-${sortOrder}`,
      routeId: "route",
      fromLabel: "始点",
      toLabel: "終点",
      mode: "walk",
      durationMin,
      sortOrder,
      createdAt: evening,
      updatedAt: evening,
    })),
  };
  const tasks: MorningTaskTemplate[] = ["準備", "朝食"].map(
    (name, sortOrder) => ({
      id: name,
      name,
      sortOrder,
      normalDurationMin: 15,
      minimumDurationMin: 10,
      requirement: sortOrder === 0 ? "required" : "optional",
      compressionPriority: sortOrder,
      skipPriority: sortOrder,
      enabled: true,
    }),
  );
  const routeRepository = {
    getDefaultRoute: async () => route.route,
    getRouteWithSegments: async () => route,
    saveRouteWithSegments: jest.fn(),
  };
  const routineRepository: RoutineRepository = {
    listEnabledTasks: async () => tasks,
    listTaskTemplates: jest.fn(),
    replaceTaskTemplates: jest.fn(),
  };
  const settingsRepository: SettingsRepository = {
    get: async () => ({
      arrivalBufferMin: 10,
      tightThresholdMin: 10,
      onboardingCompleted: true,
      createdAt: evening,
      updatedAt: evening,
    }),
    save: jest.fn(),
  };
  const scheduleRepository: ScheduleRepository = {
    getWeekdaySchedule: async () => ({
      id: "schedule",
      weekday: 2,
      isActive: true,
      title: "1限",
      startTime: "09:00",
    }),
    getOverride: async () => null,
    replaceWeekdaySchedules: jest.fn(),
    replaceDateOverrides: jest.fn(),
    saveDateOverride: jest.fn(),
    deleteDateOverride: jest.fn(),
  };
  const preview = await loadTomorrowPlan(
    { targetDate: "2026-10-13", timeZone: "Asia/Tokyo", now: evening },
    {
      scheduleRepository,
      routeRepository,
      routineRepository,
      settingsRepository,
    },
  );
  expect(preview.kind).toBe("planned");
  if (preview.kind !== "planned") throw new Error("Missing plan");
  const session = await createPlannedMorningSession(preview, {
    repository: sessionRepository,
    createId,
    now: evening,
  });
  expect(session.plannedWakeAt.toISOString()).toBe("2026-10-12T22:49:00.000Z");
  const alarmService = new FakeAlarmService({
    initialPermissionState: "granted",
  });
  const alarmDependencies = { alarmService, alarmRecordRepository, createId };
  await syncMorningAlarm({ session, now: evening }, alarmDependencies);
  await syncMorningAlarm({ session, now: evening }, alarmDependencies);
  expect(alarmService.getScheduledAlarms()).toHaveLength(1);

  const dependencies = {
    sessionRepository,
    executionRepository,
    routeRepository,
    routineRepository,
    settingsRepository,
    createId,
  };
  const wake = new Date("2026-10-12T22:54:00Z");
  const started = await startMorningSession(
    { sessionId: session.id, now: wake },
    dependencies,
  );
  expect(
    started.plan.adjustments.some(
      (adjustment) => adjustment.type === "compress",
    ),
  ).toBe(true);
  const currentTask = started.executions.find(
    (execution) => execution.status === "active",
  );
  if (!currentTask) throw new Error("Missing active task");
  await completeMorningTask(
    {
      sessionId: session.id,
      executionId: currentTask.id,
      now: new Date("2026-10-12T23:04:00Z"),
    },
    dependencies,
  );
  const restored = await startMorningSession(
    { sessionId: session.id, now: new Date("2026-10-12T23:05:00Z") },
    dependencies,
  );
  expect(restored.session.actualWakeAt).toEqual(wake);
  expect(restored.session.plannedWakeAt).toEqual(session.plannedWakeAt);
  expect(restored.plan.tasks.map((task) => task.taskId)).not.toContain(
    currentTask.taskTemplateId,
  );
  const finalTask = restored.executions.find(
    (execution) => execution.status === "active",
  );
  if (!finalTask) throw new Error("Missing final task");
  const finished = await completeMorningTask(
    {
      sessionId: session.id,
      executionId: finalTask.id,
      now: new Date("2026-10-12T23:10:00Z"),
    },
    dependencies,
  );
  expect(finished.session.status).toBe("completed");
  expect(requireSession(session.id).status).toBe("completed");
  expect(await sessionRepository.findActive(session.targetDate)).toBeNull();
  expect(
    finished.executions.every((execution) => execution.status === "completed"),
  ).toBe(true);
  await syncMorningAlarm(
    { session: finished.session, now: new Date("2026-10-12T23:10:00Z") },
    alarmDependencies,
  );
  expect(alarmService.getScheduledAlarms()).toHaveLength(0);
});
