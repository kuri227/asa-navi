import type {
  MorningSession,
  MorningSessionRepository,
  MorningTaskExecution,
  MorningTaskExecutionRepository,
  RouteRepository,
  RoutineRepository,
  SettingsRepository,
} from "@/application/ports/repositories";
import { ValidationError } from "@/application/errors/validation-error";

import { startMorningSession } from "../start-morning-session";

const now = new Date("2026-10-09T22:30:00.000Z");
const timestamp = new Date("2026-10-09T12:00:00.000Z");

describe("startMorningSession", () => {
  it("records wake time, plans tasks, and activates the first executable task", async () => {
    const dependencies = createDependencies();
    const result = await startMorningSession(
      { sessionId: "session-1", now },
      dependencies,
    );
    expect(dependencies.sessionRepository.savePlan).toHaveBeenCalledWith(
      "session-1",
      result.plan,
    );
    expect(dependencies.sessionRepository.start).toHaveBeenCalledWith(
      "session-1",
      now,
    );
    expect(result.session.status).toBe("active");
    expect(result.executions.map(({ status }) => status)).toEqual([
      "active",
      "pending",
    ]);
  });

  it("preserves completed work and replans only remaining tasks on restore", async () => {
    const dependencies = createDependencies();
    const completed = createExecution({
      id: "execution-completed",
      taskTemplateId: "task-1",
      sortOrder: 0,
      status: "completed",
      actualEndAt: new Date("2026-10-09T22:28:00.000Z"),
    });
    jest
      .mocked(dependencies.executionRepository.listForSession)
      .mockResolvedValue([completed]);
    const result = await startMorningSession(
      { sessionId: "session-1", now },
      dependencies,
    );
    expect(result.executions[0]).toBe(completed);
    expect(result.executions[1]).toMatchObject({
      taskTemplateId: "task-2",
      status: "active",
    });
    expect(result.plan.tasks).toHaveLength(1);
  });

  it("rejects a missing or finished session", async () => {
    const dependencies = createDependencies();
    jest
      .mocked(dependencies.sessionRepository.findById)
      .mockResolvedValue(null);
    await expect(
      startMorningSession({ sessionId: "missing", now }, dependencies),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(dependencies.sessionRepository.start).not.toHaveBeenCalled();
  });
});

function createDependencies() {
  const session = createSession();
  const sessionRepository: MorningSessionRepository = {
    create: jest.fn(),
    savePrepared: jest.fn(),
    findById: jest.fn().mockResolvedValue(session),
    findActive: jest.fn(),
    start: jest.fn(),
    savePlan: jest.fn(),
    updateStatus: jest.fn(),
  };
  const executionRepository: MorningTaskExecutionRepository = {
    replaceForSession: jest.fn(),
    listForSession: jest.fn().mockResolvedValue([]),
    save: jest.fn(),
  };
  const routeRepository: RouteRepository = {
    getDefaultRoute: jest.fn(),
    getRouteWithSegments: jest.fn().mockResolvedValue({
      route: {
        id: "route-1",
        name: "大学ルート",
        isDefault: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      segments: [
        {
          id: "segment-1",
          routeId: "route-1",
          sortOrder: 0,
          mode: "train",
          fromLabel: "駅",
          toLabel: "大学",
          durationMin: 30,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    }),
    saveRouteWithSegments: jest.fn(),
  };
  const routineRepository: RoutineRepository = {
    listEnabledTasks: jest
      .fn()
      .mockResolvedValue([createTask("task-1", 0), createTask("task-2", 1)]),
    listTaskTemplates: jest.fn(),
    replaceTaskTemplates: jest.fn(),
  };
  const settingsRepository: SettingsRepository = {
    get: jest.fn().mockResolvedValue({
      arrivalBufferMin: 10,
      tightThresholdMin: 10,
      onboardingCompleted: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
    save: jest.fn(),
  };
  return {
    sessionRepository,
    executionRepository,
    routeRepository,
    routineRepository,
    settingsRepository,
    createId: jest
      .fn()
      .mockReturnValueOnce("execution-1")
      .mockReturnValueOnce("execution-2"),
  };
}

function createSession(): MorningSession {
  return {
    id: "session-1",
    targetDate: "2026-10-10",
    firstEventTitle: "1限",
    firstEventStartAt: new Date("2026-10-09T23:50:00.000Z"),
    routeId: "route-1",
    plannedWakeAt: new Date("2026-10-09T22:25:00.000Z"),
    latestDepartureAt: new Date("2026-10-09T23:10:00.000Z"),
    status: "planned",
    lateByMin: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createExecution(
  update: Partial<MorningTaskExecution>,
): MorningTaskExecution {
  return {
    id: "execution-1",
    sessionId: "session-1",
    taskTemplateId: "task-1",
    sortOrder: 0,
    plannedDurationMin: 15,
    plannedAction: "normal",
    status: "pending",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...update,
  };
}

function createTask(id: string, sortOrder: number) {
  return {
    id,
    name: id,
    normalDurationMin: 15,
    minimumDurationMin: 10,
    requirement: "required" as const,
    compressionPriority: sortOrder,
    skipPriority: sortOrder,
    sortOrder,
    enabled: true,
  };
}
