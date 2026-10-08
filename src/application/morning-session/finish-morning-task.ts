import { ValidationError } from "@/application/errors/validation-error";
import type { MorningTaskExecution } from "@/application/ports/repositories";

import {
  startMorningSession,
  type ActiveMorningSession,
  type MorningSessionDependencies,
} from "./start-morning-session";

export async function completeMorningTask(
  input: Readonly<{ sessionId: string; executionId: string; now: Date }>,
  dependencies: MorningSessionDependencies,
): Promise<ActiveMorningSession> {
  return finishMorningTask(input, dependencies, "completed");
}

export async function skipOptionalMorningTask(
  input: Readonly<{ sessionId: string; executionId: string; now: Date }>,
  dependencies: MorningSessionDependencies,
): Promise<ActiveMorningSession> {
  return finishMorningTask(input, dependencies, "skipped");
}

async function finishMorningTask(
  input: Readonly<{ sessionId: string; executionId: string; now: Date }>,
  dependencies: MorningSessionDependencies,
  outcome: "completed" | "skipped",
): Promise<ActiveMorningSession> {
  const executions = await dependencies.executionRepository.listForSession(
    input.sessionId,
  );
  const target = executions.find(({ id }) => id === input.executionId);
  if (!target || !["active", "pending"].includes(target.status)) {
    throw new ValidationError("操作できる朝タスクが見つかりません。");
  }
  if (outcome === "skipped") {
    const tasks = await dependencies.routineRepository.listEnabledTasks();
    const template = tasks.find(({ id }) => id === target.taskTemplateId);
    if (!template || template.requirement !== "optional") {
      throw new ValidationError("必須タスクは省略できません。");
    }
  }

  await dependencies.executionRepository.save(
    finishExecution(target, outcome, input.now),
  );
  const active = await startMorningSession(
    { sessionId: input.sessionId, now: input.now },
    dependencies,
  );
  if (active.executions.some(({ status }) => status === "active")) {
    return active;
  }
  await dependencies.sessionRepository.updateStatus(
    input.sessionId,
    "completed",
  );
  return {
    ...active,
    session: { ...active.session, status: "completed", updatedAt: input.now },
  };
}

function finishExecution(
  execution: MorningTaskExecution,
  status: "completed" | "skipped",
  now: Date,
): MorningTaskExecution {
  return {
    ...execution,
    actualStartAt: execution.actualStartAt ?? now,
    actualEndAt: now,
    status,
    updatedAt: now,
  };
}
