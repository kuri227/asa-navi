import { z } from "zod";

import { ValidationError } from "@/application/errors/validation-error";
import type {
  RouteRepository,
  RouteWithSegments,
} from "@/application/ports/repositories";

const routeSegmentInputSchema = z.object({
  mode: z.enum(["walk", "train", "bus", "bicycle", "other"]),
  fromLabel: z.string().trim().min(1).max(100),
  toLabel: z.string().trim().min(1).max(100),
  lineName: z.string().trim().max(100).optional(),
  durationMin: z.number().int().min(0).max(1440),
});

const commuteRouteInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  segments: z.array(routeSegmentInputSchema).min(1).max(20),
});

export type CommuteRouteInput = z.input<typeof commuteRouteInputSchema>;

export type SaveCommuteRouteDependencies = Readonly<{
  repository: RouteRepository;
  createId: () => string;
  now: () => Date;
}>;

export async function saveCommuteRoute(
  input: CommuteRouteInput,
  dependencies: SaveCommuteRouteDependencies,
): Promise<RouteWithSegments> {
  const result = commuteRouteInputSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError("通学ルートの入力内容を確認してください。");
  }

  const timestamp = dependencies.now();
  const routeId = dependencies.createId();
  const route: RouteWithSegments = {
    route: {
      id: routeId,
      name: result.data.name,
      isDefault: true,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    segments: result.data.segments.map((segment, sortOrder) => ({
      id: dependencies.createId(),
      routeId,
      sortOrder,
      mode: segment.mode,
      fromLabel: segment.fromLabel,
      toLabel: segment.toLabel,
      lineName: segment.lineName || undefined,
      durationMin: segment.durationMin,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
  };

  await dependencies.repository.saveRouteWithSegments(route);
  return route;
}
