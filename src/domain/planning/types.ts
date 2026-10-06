export type TaskRequirement = "required" | "optional";

export type MorningTaskTemplate = Readonly<{
  id: string;
  name: string;
  normalDurationMin: number;
  minimumDurationMin: number;
  requirement: TaskRequirement;
  compressionPriority: number;
  skipPriority: number;
  sortOrder: number;
  enabled: boolean;
}>;

export type RouteSegmentMode = "walk" | "train" | "bus" | "bicycle" | "other";

export type RouteSegment = Readonly<{
  id: string;
  mode: RouteSegmentMode;
  fromLabel: string;
  toLabel: string;
  durationMin: number;
  sortOrder: number;
}>;

export type FirstEvent = Readonly<{
  id: string;
  title: string;
  startAt: Date;
  locationLabel?: string;
}>;

export type PlanningInput = Readonly<{
  now: Date;
  firstEvent: FirstEvent;
  arrivalBufferMin: number;
  routeSegments: readonly RouteSegment[];
  tasks: readonly MorningTaskTemplate[];
  completedTaskIds: readonly string[];
}>;

export type PlannedTaskAction = "normal" | "compressed" | "skipped";

export type PlannedTask = Readonly<{
  taskId: string;
  name: string;
  plannedDurationMin: number;
  action: PlannedTaskAction;
  plannedStartAt?: Date;
  plannedEndAt?: Date;
}>;

export type PlanStatus = "comfortable" | "tight" | "late";

export type PlanningAdjustment =
  | Readonly<{
      type: "compress";
      taskId: string;
      fromMin: number;
      toMin: number;
    }>
  | Readonly<{ type: "skip"; taskId: string; savedMin: number }>
  | Readonly<{ type: "late"; lateByMin: number }>;

export type PlanningResult = Readonly<{
  recommendedWakeAt: Date;
  latestDepartureAt: Date;
  predictedDepartureAt: Date;
  predictedArrivalAt: Date;
  slackMin: number;
  lateByMin: number;
  status: PlanStatus;
  tasks: readonly PlannedTask[];
  adjustments: readonly PlanningAdjustment[];
}>;
