import type { SQLiteBindParams } from "expo-sqlite";

import { RepositoryError } from "@/application/errors/repository-error";

import type { MutationDatabase, WriteDatabase } from "../../query-database";
import { SQLiteRouteRepository } from "../sqlite-route-repository";
import { SQLiteRoutineRepository } from "../sqlite-routine-repository";
import { SQLiteScheduleRepository } from "../sqlite-schedule-repository";

class FakeQueryDatabase implements MutationDatabase {
  readonly calls: { sql: string; params?: SQLiteBindParams }[] = [];

  constructor(
    private readonly firstRows: unknown[] = [],
    private readonly allRows: unknown[][] = [],
  ) {}

  async getFirstAsync<T>(
    sql: string,
    params?: SQLiteBindParams,
  ): Promise<T | null> {
    this.calls.push({ sql, params });
    return (this.firstRows.shift() ?? null) as T | null;
  }

  async getAllAsync<T>(sql: string, params?: SQLiteBindParams): Promise<T[]> {
    this.calls.push({ sql, params });
    return (this.allRows.shift() ?? []) as T[];
  }

  async runAsync(sql: string, params?: SQLiteBindParams): Promise<unknown> {
    this.calls.push({ sql, params });
    return undefined;
  }

  withExclusiveTransactionAsync(
    task: (transaction: WriteDatabase) => Promise<void>,
  ): Promise<void> {
    return task(this);
  }
}

const timestamp = "2026-10-06T00:00:00.000Z";

describe("SQLiteScheduleRepository", () => {
  it("maps a weekday row and binds the weekday", async () => {
    const database = new FakeQueryDatabase([
      {
        id: "schedule-1",
        weekday: 2,
        title: "1限",
        start_time: "08:50",
        location_label: "A棟",
        route_id: "route-1",
        is_active: 1,
      },
    ]);

    const result = await new SQLiteScheduleRepository(
      database,
    ).getWeekdaySchedule(2);

    expect(result).toEqual({
      id: "schedule-1",
      weekday: 2,
      title: "1限",
      startTime: "08:50",
      locationLabel: "A棟",
      routeId: "route-1",
      isActive: true,
    });
    expect(database.calls[0].params).toEqual({ $weekday: 2 });
  });

  it("rejects a replace override without its required event data", async () => {
    const database = new FakeQueryDatabase([
      {
        id: "override-1",
        target_date: "2026-10-06",
        override_type: "replace",
        title: null,
        start_time: null,
        location_label: null,
        route_id: null,
      },
    ]);

    await expect(
      new SQLiteScheduleRepository(database).getOverride("2026-10-06"),
    ).rejects.toMatchObject<Partial<RepositoryError>>({
      code: "mapping_failed",
    });
  });

  it("replaces weekday schedules in one transaction", async () => {
    const database = new FakeQueryDatabase();
    const repository = new SQLiteScheduleRepository(
      database,
      () => new Date(timestamp),
    );

    await repository.replaceWeekdaySchedules([
      {
        id: "schedule-1",
        weekday: 1,
        title: "1限",
        startTime: "08:50",
        locationLabel: "A棟",
        routeId: "route-1",
        isActive: true,
      },
    ]);

    expect(
      database.calls.map(({ sql }) =>
        sql.trim().split(/\s+/).slice(0, 3).join(" "),
      ),
    ).toEqual([
      "DELETE FROM weekday_schedules",
      "INSERT INTO weekday_schedules",
    ]);
    expect(database.calls[1].params).toMatchObject({
      $weekday: 1,
      $startTime: "08:50",
      $routeId: "route-1",
      $now: timestamp,
    });
  });

  it("replaces cancel and replace overrides in one transaction", async () => {
    const database = new FakeQueryDatabase();
    const repository = new SQLiteScheduleRepository(
      database,
      () => new Date(timestamp),
    );
    await repository.replaceDateOverrides([
      { id: "cancel-1", targetDate: "2026-10-13", overrideType: "cancel" },
      {
        id: "replace-1",
        targetDate: "2026-10-20",
        overrideType: "replace",
        title: "2限",
        startTime: "10:40",
        routeId: "route-1",
      },
    ]);
    expect(database.calls).toHaveLength(3);
    expect(database.calls[1].params).toMatchObject({
      $overrideType: "cancel",
      $title: null,
      $routeId: null,
    });
    expect(database.calls[2].params).toMatchObject({
      $overrideType: "replace",
      $title: "2限",
      $routeId: "route-1",
    });
  });

  it("upserts one date override without deleting other dates", async () => {
    const database = new FakeQueryDatabase();
    const repository = new SQLiteScheduleRepository(
      database,
      () => new Date(timestamp),
    );
    await repository.saveDateOverride({
      id: "override-1",
      targetDate: "2026-10-10",
      overrideType: "cancel",
    });
    expect(database.calls).toHaveLength(1);
    expect(database.calls[0].sql).toContain("ON CONFLICT(target_date)");
    expect(database.calls[0].sql).not.toContain("DELETE FROM");
    expect(database.calls[0].params).toMatchObject({
      $targetDate: "2026-10-10",
      $overrideType: "cancel",
    });
  });

  it("deletes only the requested date override", async () => {
    const database = new FakeQueryDatabase();
    await new SQLiteScheduleRepository(database).deleteDateOverride(
      "2026-10-10",
    );
    expect(database.calls).toHaveLength(1);
    expect(database.calls[0].sql).toContain(
      "DELETE FROM date_schedule_overrides WHERE target_date = $targetDate",
    );
    expect(database.calls[0].params).toEqual({ $targetDate: "2026-10-10" });
  });
});

describe("SQLiteRouteRepository", () => {
  it("returns route segments in the database order", async () => {
    const database = new FakeQueryDatabase(
      [
        {
          id: "route-1",
          name: "大学ルート",
          origin_place_id: null,
          destination_place_id: null,
          is_default: 1,
          is_active: 1,
          created_at: timestamp,
          updated_at: timestamp,
        },
      ],
      [
        [
          {
            id: "segment-1",
            route_id: "route-1",
            sort_order: 0,
            mode: "walk",
            from_label: "自宅",
            to_label: "駅",
            line_name: null,
            duration_min: 8,
            from_place_id: null,
            to_place_id: null,
            created_at: timestamp,
            updated_at: timestamp,
          },
        ],
      ],
    );

    const result = await new SQLiteRouteRepository(
      database,
    ).getRouteWithSegments("route-1");

    expect(result?.route.name).toBe("大学ルート");
    expect(result?.segments[0]).toMatchObject({ mode: "walk", durationMin: 8 });
    expect(database.calls[1].params).toEqual({ $routeId: "route-1" });
  });

  it("replaces route segments in one transaction", async () => {
    const database = new FakeQueryDatabase();
    const repository = new SQLiteRouteRepository(database);

    await repository.saveRouteWithSegments({
      route: {
        id: "route-1",
        name: "大学ルート",
        isDefault: true,
        isActive: true,
        createdAt: new Date(timestamp),
        updatedAt: new Date(timestamp),
      },
      segments: [
        {
          id: "segment-1",
          routeId: "route-1",
          sortOrder: 0,
          mode: "walk",
          fromLabel: "自宅",
          toLabel: "吹田駅",
          durationMin: 8,
          createdAt: new Date(timestamp),
          updatedAt: new Date(timestamp),
        },
      ],
    });

    expect(
      database.calls.map(({ sql }) =>
        sql.trim().split(/\s+/).slice(0, 3).join(" "),
      ),
    ).toEqual([
      "UPDATE commute_routes SET",
      "INSERT INTO commute_routes",
      "DELETE FROM route_segments",
      "INSERT INTO route_segments",
    ]);
    expect(database.calls[3].params).toMatchObject({
      $routeId: "route-1",
      $sortOrder: 0,
      $durationMin: 8,
    });
  });
});

describe("SQLiteRoutineRepository", () => {
  it("maps validated task rows to Planning Engine input", async () => {
    const database = new FakeQueryDatabase(
      [],
      [
        [
          {
            id: "task-1",
            name: "朝食",
            normal_duration_min: 15,
            minimum_duration_min: 8,
            requirement: "required",
            compression_priority: 10,
            skip_priority: 100,
            sort_order: 0,
            enabled: 1,
            special_type: "meal",
            created_at: timestamp,
            updated_at: timestamp,
          },
        ],
      ],
    );

    const result = await new SQLiteRoutineRepository(
      database,
    ).listEnabledTasks();

    expect(result).toEqual([
      {
        id: "task-1",
        name: "朝食",
        normalDurationMin: 15,
        minimumDurationMin: 8,
        requirement: "required",
        compressionPriority: 10,
        skipPriority: 100,
        sortOrder: 0,
        enabled: true,
      },
    ]);
  });

  it("rejects a task whose minimum duration exceeds normal duration", async () => {
    const database = new FakeQueryDatabase(
      [],
      [
        [
          {
            id: "task-invalid",
            name: "不正タスク",
            normal_duration_min: 5,
            minimum_duration_min: 6,
            requirement: "required",
            compression_priority: 10,
            skip_priority: 10,
            sort_order: 0,
            enabled: 1,
            special_type: null,
            created_at: timestamp,
            updated_at: timestamp,
          },
        ],
      ],
    );

    await expect(
      new SQLiteRoutineRepository(database).listEnabledTasks(),
    ).rejects.toMatchObject<Partial<RepositoryError>>({
      code: "mapping_failed",
    });
  });

  it("replaces task templates in one transaction", async () => {
    const database = new FakeQueryDatabase();
    const repository = new SQLiteRoutineRepository(
      database,
      () => new Date(timestamp),
    );
    await repository.replaceTaskTemplates([
      {
        id: "task-1",
        name: "朝食",
        normalDurationMin: 15,
        minimumDurationMin: 8,
        requirement: "required",
        compressionPriority: 0,
        skipPriority: 0,
        sortOrder: 0,
        enabled: true,
        specialType: "meal",
        createdAt: new Date(timestamp),
        updatedAt: new Date(timestamp),
      },
    ]);
    expect(database.calls).toHaveLength(2);
    expect(database.calls[0].sql).toContain(
      "DELETE FROM morning_task_templates",
    );
    expect(database.calls[1].params).toMatchObject({
      $name: "朝食",
      $normalDurationMin: 15,
      $minimumDurationMin: 8,
      $sortOrder: 0,
      $updatedAt: timestamp,
    });
  });
});
