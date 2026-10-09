import { ValidationError } from "@/application/errors/validation-error";
import type {
  MorningSession,
  MorningSessionRepository,
  MorningTaskExecution,
  MorningTaskExecutionRepository,
  RouteRepository,
  RoutineRepository,
  SettingsRepository,
} from "@/application/ports/repositories";
import { calculatePlan, type PlanningResult } from "@/domain/planning";

export type ActiveMorningSession = Readonly<{
  session: MorningSession;
  executions: readonly MorningTaskExecution[];
  plan: PlanningResult;
  optionalTaskIds: readonly string[];
}>;

export type MorningSessionDependencies = Readonly<{
  sessionRepository: MorningSessionRepository;
  executionRepository: MorningTaskExecutionRepository;
  routeRepository: RouteRepository;
  routineRepository: RoutineRepository;
  settingsRepository: SettingsRepository;
  createId: () => string;
}>;

export async function startMorningSession(
  input: Readonly<{ sessionId: string; now: Date }>,
  dependencies: MorningSessionDependencies,
): Promise<ActiveMorningSession> {
  const session = await dependencies.sessionRepository.findById(
    input.sessionId,
  );
  if (!session || !["planned", "active"].includes(session.status)) {
    throw new ValidationError("開始できる朝の予定が見つかりません。");
  }

  const defaultRoute = session.routeId
    ? null
    : await dependencies.routeRepository.getDefaultRoute();
  const routeId = session.routeId ?? defaultRoute?.id;
  if (!routeId) throw new ValidationError("通学ルートが見つかりません。");

  const [route, tasks, settings, existingExecutions] = await Promise.all([
    dependencies.routeRepository.getRouteWithSegments(routeId),
    dependencies.routineRepository.listEnabledTasks(),
    dependencies.settingsRepository.get(),
    dependencies.executionRepository.listForSession(session.id),
  ]);
  if (!route) throw new ValidationError("通学ルートを読み込めませんでした。");

  const completedTaskIds = existingExecutions
    .filter(({ status }) => ["completed", "skipped"].includes(status))
    .map(({ taskTemplateId }) => taskTemplateId);
  const plan = calculatePlan({
    now: input.now,
    firstEvent: {
      id: session.id,
      title: session.firstEventTitle,
      startAt: session.firstEventStartAt,
    },
    arrivalBufferMin: settings.arrivalBufferMin,
    routeSegments: route.segments,
    tasks,
    completedTaskIds,
  });
  const executions = mergeExecutions({
    sessionId: session.id,
    tasks,
    plan,
    existingExecutions,
    now: input.now,
    createId: dependencies.createId,
  });

  await dependencies.sessionRepository.savePlan(session.id, plan);
  await dependencies.executionRepository.replaceForSession(
    session.id,
    executions,
  );
  await dependencies.sessionRepository.start(session.id, input.now);

  return {
    session: {
      ...session,
      actualWakeAt: session.actualWakeAt ?? input.now,
      plannedWakeAt: plan.recommendedWakeAt,
      latestDepartureAt: plan.latestDepartureAt,
      predictedDepartureAt: plan.predictedDepartureAt,
      predictedArrivalAt: plan.predictedArrivalAt,
      status: "active",
      planStatus: plan.status,
      lateByMin: plan.lateByMin,
      updatedAt: input.now,
    },
    executions,
    plan,
    optionalTaskIds: tasks
      .filter(({ requirement }) => requirement === "optional")
      .map(({ id }) => id),
  };
}

function mergeExecutions(
  input: Readonly<{
    sessionId: string;
    tasks: Awaited<ReturnType<RoutineRepository["listEnabledTasks"]>>;
    plan: PlanningResult;
    existingExecutions: readonly MorningTaskExecution[];
    now: Date;
    createId: () => string;
  }>,
): readonly MorningTaskExecution[] {
  const existingByTask = new Map(
    input.existingExecutions.map((execution) => [
      execution.taskTemplateId,
      execution,
    ]),
  );
  const taskOrder = new Map(
    input.tasks.map((task) => [task.id, task.sortOrder]),
  );
  const terminal = input.existingExecutions.filter(({ status }) =>
    ["completed", "skipped"].includes(status),
  );
  let activeAssigned = false;
  const remaining = input.plan.tasks.map<MorningTaskExecution>((task) => {
    const existing = existingByTask.get(task.taskId);
    let status: MorningTaskExecution["status"];
    if (task.action === "skipped") {
      status = "skipped";
    } else if (activeAssigned) {
      status = "pending";
    } else {
      status = "active";
      activeAssigned = true;
    }
    return {
      id: existing?.id ?? input.createId(),
      sessionId: input.sessionId,
      taskTemplateId: task.taskId,
      sortOrder: taskOrder.get(task.taskId) ?? 0,
      plannedDurationMin: task.plannedDurationMin,
      plannedAction: task.action,
      plannedStartAt: task.plannedStartAt,
      plannedEndAt: task.plannedEndAt,
      actualStartAt:
        status === "active"
          ? (existing?.actualStartAt ?? input.now)
          : existing?.actualStartAt,
      actualEndAt: existing?.actualEndAt,
      status,
      createdAt: existing?.createdAt ?? input.now,
      updatedAt: input.now,
    };
  });
  return [...terminal, ...remaining].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
}
