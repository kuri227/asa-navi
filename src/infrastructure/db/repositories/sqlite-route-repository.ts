import { z } from "zod";

import type {
  CommuteRoute,
  CommuteRouteSegment,
  RouteRepository,
  RouteWithSegments,
} from "@/application/ports/repositories";

import type { MutationDatabase } from "../query-database";
import {
  booleanIntegerSchema,
  isoDateTimeSchema,
  nullableStringSchema,
  parseDatabaseRow,
  runRepositoryQuery,
} from "./row-validation";

const routeRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  origin_place_id: nullableStringSchema,
  destination_place_id: nullableStringSchema,
  is_default: booleanIntegerSchema,
  is_active: booleanIntegerSchema,
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

const segmentRowSchema = z.object({
  id: z.string().min(1),
  route_id: z.string().min(1),
  sort_order: z.number().int().min(0),
  mode: z.enum(["walk", "train", "bus", "bicycle", "other"]),
  from_label: z.string().min(1),
  to_label: z.string().min(1),
  line_name: nullableStringSchema,
  duration_min: z.number().int().min(0),
  from_place_id: nullableStringSchema,
  to_place_id: nullableStringSchema,
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

function mapRoute(row: unknown): CommuteRoute {
  const value = parseDatabaseRow(routeRowSchema, row, "通学ルート");
  return {
    id: value.id,
    name: value.name,
    originPlaceId: value.origin_place_id,
    destinationPlaceId: value.destination_place_id,
    isDefault: value.is_default,
    isActive: value.is_active,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

function mapSegment(row: unknown): CommuteRouteSegment {
  const value = parseDatabaseRow(segmentRowSchema, row, "通学区間");
  return {
    id: value.id,
    routeId: value.route_id,
    sortOrder: value.sort_order,
    mode: value.mode,
    fromLabel: value.from_label,
    toLabel: value.to_label,
    lineName: value.line_name,
    durationMin: value.duration_min,
    fromPlaceId: value.from_place_id,
    toPlaceId: value.to_place_id,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

export class SQLiteRouteRepository implements RouteRepository {
  constructor(private readonly database: MutationDatabase) {}

  getDefaultRoute(): Promise<CommuteRoute | null> {
    return runRepositoryQuery(async () => {
      const row = await this.database.getFirstAsync(
        `SELECT * FROM commute_routes
         WHERE is_default = 1 AND is_active = 1
         ORDER BY updated_at DESC, id ASC LIMIT 1`,
      );
      return row === null ? null : mapRoute(row);
    });
  }

  getRouteWithSegments(routeId: string): Promise<RouteWithSegments | null> {
    return runRepositoryQuery(async () => {
      const routeRow = await this.database.getFirstAsync(
        "SELECT * FROM commute_routes WHERE id = $routeId LIMIT 1",
        { $routeId: routeId },
      );
      if (routeRow === null) return null;
      const segmentRows = await this.database.getAllAsync(
        `SELECT * FROM route_segments WHERE route_id = $routeId
         ORDER BY sort_order ASC, id ASC`,
        { $routeId: routeId },
      );
      return {
        route: mapRoute(routeRow),
        segments: segmentRows.map(mapSegment),
      };
    });
  }

  saveRouteWithSegments(routeWithSegments: RouteWithSegments): Promise<void> {
    return runRepositoryQuery(() =>
      this.database.withExclusiveTransactionAsync(async (transaction) => {
        const { route, segments } = routeWithSegments;
        if (route.isDefault) {
          await transaction.runAsync(
            "UPDATE commute_routes SET is_default = 0 WHERE id <> $routeId",
            { $routeId: route.id },
          );
        }
        await transaction.runAsync(
          `INSERT INTO commute_routes (
            id, name, origin_place_id, destination_place_id, is_default,
            is_active, created_at, updated_at
          ) VALUES (
            $id, $name, $originPlaceId, $destinationPlaceId, $isDefault,
            $isActive, $createdAt, $updatedAt
          )
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            origin_place_id = excluded.origin_place_id,
            destination_place_id = excluded.destination_place_id,
            is_default = excluded.is_default,
            is_active = excluded.is_active,
            updated_at = excluded.updated_at`,
          {
            $id: route.id,
            $name: route.name,
            $originPlaceId: route.originPlaceId ?? null,
            $destinationPlaceId: route.destinationPlaceId ?? null,
            $isDefault: route.isDefault ? 1 : 0,
            $isActive: route.isActive ? 1 : 0,
            $createdAt: route.createdAt.toISOString(),
            $updatedAt: route.updatedAt.toISOString(),
          },
        );
        await transaction.runAsync(
          "DELETE FROM route_segments WHERE route_id = $routeId",
          { $routeId: route.id },
        );
        for (const segment of segments) {
          await transaction.runAsync(
            `INSERT INTO route_segments (
              id, route_id, sort_order, mode, from_label, to_label,
              line_name, duration_min, from_place_id, to_place_id,
              created_at, updated_at
            ) VALUES (
              $id, $routeId, $sortOrder, $mode, $fromLabel, $toLabel,
              $lineName, $durationMin, $fromPlaceId, $toPlaceId,
              $createdAt, $updatedAt
            )`,
            {
              $id: segment.id,
              $routeId: segment.routeId,
              $sortOrder: segment.sortOrder,
              $mode: segment.mode,
              $fromLabel: segment.fromLabel,
              $toLabel: segment.toLabel,
              $lineName: segment.lineName ?? null,
              $durationMin: segment.durationMin,
              $fromPlaceId: segment.fromPlaceId ?? null,
              $toPlaceId: segment.toPlaceId ?? null,
              $createdAt: segment.createdAt.toISOString(),
              $updatedAt: segment.updatedAt.toISOString(),
            },
          );
        }
      }),
    );
  }
}
