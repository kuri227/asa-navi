import type { SQLiteBindParams } from "expo-sqlite";

import type {
  MorningSession,
  MorningTaskExecution,
} from "@/application/ports/repositories";

import type { MutationDatabase, WriteDatabase } from "../../query-database";
import { SQLiteMorningSessionRepository } from "../sqlite-morning-session-repository";
import { SQLiteMorningTaskExecutionRepository } from "../sqlite-task-execution-repository";

type RunCall = Readonly<{ sql: string; params?: SQLiteBindParams }>;

class FakeMutationDatabase implements MutationDatabase {
  readonly runCalls: RunCall[] = [];
  transactionCount = 0;

  constructor(
    private readonly firstRows: unknown[] = [],
    private readonly allRows: unknown[][] = [],
  ) {}

  async getFirstAsync<T>(
    _sql: string,
    _params?: SQLiteBindParams,
  ): Promise<T | null> {
    return (this.firstRows.shift() ?? null) as T | null;
  }

  async getAllAsync<T>(_sql: string, _params?: SQLiteBindParams): Promise<T[]> {
    return (this.allRows.shift() ?? []) as T[];
  }

  async runAsync(sql: string, params?: SQLiteBindParams): Promise<void> {
    this.runCalls.push({ sql, params });
  }

  async withExclusiveTransactionAsync(
    task: (transaction: WriteDatabase) => Promise<void>,
  ): Promise<void> {
    this.transactionCount += 1;
    await task(this);
  }
}

const createdAt = new Date("2026-10-05T20:00:00.000Z");
const updatedAt = new Date("2026-10-05T21:00:00.000Z");

const session: MorningSession = {
  id: "session-1",
  targetDate: "2026-10-06",
  firstEventTitle: "1限",
  firstEventStartAt: new Date("2026-10-05T23:50:00.000Z"),
  routeId: "route-1",
  plannedWakeAt: new Date("2026-10-05T21:30:00.000Z"),
  latestDepartureAt: new Date("2026-10-05T23:00:00.000Z"),
  status: "planned",
  planStatus: "comfortable",
  lateByMin: 0,
  createdAt,
  updatedAt,
};

describe("SQLiteMorningSessionRepository", () => {
  it("binds session values as ISO timestamps when creating", async () => {
    const database = new FakeMutationDatabase();

    await new SQLiteMorningSessionRepository(database).create(session);

    expect(database.runCalls).toHaveLength(1);
    expect(database.runCalls[0].params).toMatchObject({
      $id: "session-1",
      $targetDate: "2026-10-06",
      $plannedWakeAt: "2026-10-05T21:30:00.000Z",
      $actualWakeAt: null,
    });
  });

  it("restores the active session with Date values", async () => {
    const database = new FakeMutationDatabase([
      {
        id: "session-1",
        target_date: "2026-10-06",
        first_event_title: "1限",
        first_event_start_at: "2026-10-05T23:50:00.000Z",
        route_id: "route-1",
        planned_wake_at: "2026-10-05T21:30:00.000Z",
        actual_wake_at: null,
        latest_departure_at: "2026-10-05T23:00:00.000Z",
        predicted_departure_at: null,
        predicted_arrival_at: null,
        status: "active",
        plan_status: "comfortable",
        late_by_min: 0,
        created_at: createdAt.toISOString(),
        updated_at: updatedAt.toISOString(),
      },
    ]);

    const restored = await new SQLiteMorningSessionRepository(
      database,
    ).findActive("2026-10-06");

    expect(restored?.status).toBe("active");
    expect(restored?.plannedWakeAt).toEqual(
      new Date("2026-10-05T21:30:00.000Z"),
    );
  });

  it("records the first wake time and marks a session active", async () => {
    const database = new FakeMutationDatabase();
    const repository = new SQLiteMorningSessionRepository(
      database,
      () => updatedAt,
    );
    const actualWakeAt = new Date("2026-10-05T21:35:00.000Z");
    await repository.start("session-1", actualWakeAt);
    expect(database.runCalls[0].sql).toContain(
      "actual_wake_at = COALESCE(actual_wake_at, $actualWakeAt)",
    );
    expect(database.runCalls[0].params).toMatchObject({
      $sessionId: "session-1",
      $actualWakeAt: actualWakeAt.toISOString(),
      $updatedAt: updatedAt.toISOString(),
    });
  });

  it("updates a prepared session only while it is still planned", async () => {
    const database = new FakeMutationDatabase();
    await new SQLiteMorningSessionRepository(database).savePrepared(session);
    expect(database.runCalls[0].sql).toContain("status = 'planned'");
    expect(database.runCalls[0].params).toMatchObject({
      $id: "session-1",
      $firstEventTitle: "1限",
      $routeId: "route-1",
    });
  });
});

describe("SQLiteMorningTaskExecutionRepository", () => {
  const execution: MorningTaskExecution = {
    id: "execution-1",
    sessionId: "session-1",
    taskTemplateId: "task-1",
    sortOrder: 0,
    plannedDurationMin: 8,
    plannedAction: "compressed",
    status: "pending",
    createdAt,
    updatedAt,
  };

  it("replaces a session plan in one exclusive transaction", async () => {
    const database = new FakeMutationDatabase();

    await new SQLiteMorningTaskExecutionRepository(database).replaceForSession(
      "session-1",
      [execution],
    );

    expect(database.transactionCount).toBe(1);
    expect(database.runCalls).toHaveLength(2);
    expect(database.runCalls[0].sql).toContain(
      "DELETE FROM morning_task_executions",
    );
    expect(database.runCalls[1].params).toMatchObject({
      $id: "execution-1",
      $action: "compressed",
      $plannedDurationMin: 8,
    });
  });
});
