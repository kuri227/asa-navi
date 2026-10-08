import { z } from "zod";

import type {
  MorningSession,
  MorningSessionRepository,
} from "@/application/ports/repositories";
import type { PlanningResult } from "@/domain/planning";

import type { MutationDatabase } from "../query-database";
import {
  isoDateTimeSchema,
  nullableDateTimeSchema,
  nullableStringSchema,
  parseDatabaseRow,
  runRepositoryQuery,
} from "./row-validation";

const sessionRowSchema = z.object({
  id: z.string().min(1),
  target_date: z.iso.date(),
  first_event_title: z.string().min(1),
  first_event_start_at: isoDateTimeSchema,
  route_id: nullableStringSchema,
  planned_wake_at: isoDateTimeSchema,
  actual_wake_at: nullableDateTimeSchema,
  latest_departure_at: isoDateTimeSchema,
  predicted_departure_at: nullableDateTimeSchema,
  predicted_arrival_at: nullableDateTimeSchema,
  status: z.enum(["planned", "active", "completed", "cancelled"]),
  plan_status: z
    .enum(["comfortable", "tight", "late"])
    .nullable()
    .transform((value) => value ?? undefined),
  late_by_min: z.number().int().min(0),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

function mapSession(row: unknown): MorningSession {
  const value = parseDatabaseRow(sessionRowSchema, row, "朝セッション");
  return {
    id: value.id,
    targetDate: value.target_date,
    firstEventTitle: value.first_event_title,
    firstEventStartAt: value.first_event_start_at,
    routeId: value.route_id,
    plannedWakeAt: value.planned_wake_at,
    actualWakeAt: value.actual_wake_at,
    latestDepartureAt: value.latest_departure_at,
    predictedDepartureAt: value.predicted_departure_at,
    predictedArrivalAt: value.predicted_arrival_at,
    status: value.status,
    planStatus: value.plan_status,
    lateByMin: value.late_by_min,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

export class SQLiteMorningSessionRepository implements MorningSessionRepository {
  constructor(
    private readonly database: MutationDatabase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  create(session: MorningSession): Promise<void> {
    return runRepositoryQuery(async () => {
      await this.database.runAsync(
        `INSERT INTO morning_sessions (
          id, target_date, first_event_title, first_event_start_at, route_id,
          planned_wake_at, actual_wake_at, latest_departure_at,
          predicted_departure_at, predicted_arrival_at, status, plan_status,
          late_by_min, created_at, updated_at
        ) VALUES (
          $id, $targetDate, $firstEventTitle, $firstEventStartAt, $routeId,
          $plannedWakeAt, $actualWakeAt, $latestDepartureAt,
          $predictedDepartureAt, $predictedArrivalAt, $status, $planStatus,
          $lateByMin, $createdAt, $updatedAt
        )`,
        toSessionParams(session),
      );
    });
  }

  savePrepared(session: MorningSession): Promise<void> {
    return runRepositoryQuery(async () => {
      await this.database.runAsync(
        `UPDATE morning_sessions SET
          first_event_title = $firstEventTitle,
          first_event_start_at = $firstEventStartAt,
          route_id = $routeId,
          planned_wake_at = $plannedWakeAt,
          latest_departure_at = $latestDepartureAt,
          updated_at = $updatedAt
         WHERE id = $id AND status = 'planned'`,
        {
          $id: session.id,
          $firstEventTitle: session.firstEventTitle,
          $firstEventStartAt: session.firstEventStartAt.toISOString(),
          $routeId: session.routeId ?? null,
          $plannedWakeAt: session.plannedWakeAt.toISOString(),
          $latestDepartureAt: session.latestDepartureAt.toISOString(),
          $updatedAt: session.updatedAt.toISOString(),
        },
      );
    });
  }

  findById(sessionId: string): Promise<MorningSession | null> {
    return runRepositoryQuery(async () => {
      const row = await this.database.getFirstAsync(
        "SELECT * FROM morning_sessions WHERE id = $sessionId LIMIT 1",
        { $sessionId: sessionId },
      );
      return row === null ? null : mapSession(row);
    });
  }

  findActive(targetDate: string): Promise<MorningSession | null> {
    return runRepositoryQuery(async () => {
      const row = await this.database.getFirstAsync(
        `SELECT * FROM morning_sessions
         WHERE target_date = $targetDate AND status IN ('planned', 'active')
         ORDER BY updated_at DESC, id ASC LIMIT 1`,
        { $targetDate: targetDate },
      );
      return row === null ? null : mapSession(row);
    });
  }

  start(sessionId: string, actualWakeAt: Date): Promise<void> {
    return runRepositoryQuery(async () => {
      await this.database.runAsync(
        `UPDATE morning_sessions SET
          actual_wake_at = COALESCE(actual_wake_at, $actualWakeAt),
          status = 'active',
          updated_at = $updatedAt
         WHERE id = $sessionId AND status IN ('planned', 'active')`,
        {
          $sessionId: sessionId,
          $actualWakeAt: actualWakeAt.toISOString(),
          $updatedAt: this.now().toISOString(),
        },
      );
    });
  }

  savePlan(sessionId: string, result: PlanningResult): Promise<void> {
    return runRepositoryQuery(async () => {
      await this.database.runAsync(
        `UPDATE morning_sessions SET
          planned_wake_at = $plannedWakeAt,
          latest_departure_at = $latestDepartureAt,
          predicted_departure_at = $predictedDepartureAt,
          predicted_arrival_at = $predictedArrivalAt,
          plan_status = $planStatus,
          late_by_min = $lateByMin,
          updated_at = $updatedAt
         WHERE id = $sessionId`,
        {
          $sessionId: sessionId,
          $plannedWakeAt: result.recommendedWakeAt.toISOString(),
          $latestDepartureAt: result.latestDepartureAt.toISOString(),
          $predictedDepartureAt: result.predictedDepartureAt.toISOString(),
          $predictedArrivalAt: result.predictedArrivalAt.toISOString(),
          $planStatus: result.status,
          $lateByMin: result.lateByMin,
          $updatedAt: this.now().toISOString(),
        },
      );
    });
  }

  updateStatus(
    sessionId: string,
    status: MorningSession["status"],
  ): Promise<void> {
    return runRepositoryQuery(async () => {
      await this.database.runAsync(
        `UPDATE morning_sessions SET status = $status, updated_at = $updatedAt
         WHERE id = $sessionId`,
        {
          $sessionId: sessionId,
          $status: status,
          $updatedAt: this.now().toISOString(),
        },
      );
    });
  }
}

function toSessionParams(session: MorningSession) {
  return {
    $id: session.id,
    $targetDate: session.targetDate,
    $firstEventTitle: session.firstEventTitle,
    $firstEventStartAt: session.firstEventStartAt.toISOString(),
    $routeId: session.routeId ?? null,
    $plannedWakeAt: session.plannedWakeAt.toISOString(),
    $actualWakeAt: session.actualWakeAt?.toISOString() ?? null,
    $latestDepartureAt: session.latestDepartureAt.toISOString(),
    $predictedDepartureAt: session.predictedDepartureAt?.toISOString() ?? null,
    $predictedArrivalAt: session.predictedArrivalAt?.toISOString() ?? null,
    $status: session.status,
    $planStatus: session.planStatus ?? null,
    $lateByMin: session.lateByMin,
    $createdAt: session.createdAt.toISOString(),
    $updatedAt: session.updatedAt.toISOString(),
  };
}
