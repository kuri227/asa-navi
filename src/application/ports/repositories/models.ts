import type {
  PlanStatus,
  PlannedTaskAction,
  RouteSegmentMode,
  TaskRequirement,
} from "@/domain/planning";

export type PlaceKind = "home" | "school" | "station" | "bus_stop" | "other";

export type Place = Readonly<{
  id: string;
  name: string;
  kind: PlaceKind;
  addressText?: string;
  latitude?: number;
  longitude?: number;
  externalPlaceId?: string;
  createdAt: Date;
  updatedAt: Date;
}>;

export type CommuteRoute = Readonly<{
  id: string;
  name: string;
  originPlaceId?: string;
  destinationPlaceId?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}>;

export type CommuteRouteSegment = Readonly<{
  id: string;
  routeId: string;
  sortOrder: number;
  mode: RouteSegmentMode;
  fromLabel: string;
  toLabel: string;
  lineName?: string;
  durationMin: number;
  fromPlaceId?: string;
  toPlaceId?: string;
  createdAt: Date;
  updatedAt: Date;
}>;

export type RouteWithSegments = Readonly<{
  route: CommuteRoute;
  segments: readonly CommuteRouteSegment[];
}>;

export type MorningSessionStatus =
  "planned" | "active" | "completed" | "cancelled";

export type MorningSession = Readonly<{
  id: string;
  targetDate: string;
  firstEventTitle: string;
  firstEventStartAt: Date;
  routeId?: string;
  plannedWakeAt: Date;
  actualWakeAt?: Date;
  latestDepartureAt: Date;
  predictedDepartureAt?: Date;
  predictedArrivalAt?: Date;
  status: MorningSessionStatus;
  planStatus?: PlanStatus;
  lateByMin: number;
  createdAt: Date;
  updatedAt: Date;
}>;

export type MorningTaskExecutionStatus =
  "pending" | "active" | "completed" | "skipped";

export type MorningTaskExecution = Readonly<{
  id: string;
  sessionId: string;
  taskTemplateId: string;
  sortOrder: number;
  plannedDurationMin: number;
  plannedAction: PlannedTaskAction;
  plannedStartAt?: Date;
  plannedEndAt?: Date;
  actualStartAt?: Date;
  actualEndAt?: Date;
  status: MorningTaskExecutionStatus;
  createdAt: Date;
  updatedAt: Date;
}>;

export type AlarmRecordStatus =
  "scheduled" | "cancelled" | "triggered" | "failed";

export type AlarmRecord = Readonly<{
  id: string;
  sessionId: string;
  scheduledAt: Date;
  platformNotificationId?: string;
  status: AlarmRecordStatus;
  createdAt: Date;
  updatedAt: Date;
}>;

export type AppSettings = Readonly<{
  arrivalBufferMin: number;
  tightThresholdMin: number;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}>;

export type MorningTaskSpecialType =
  "meal" | "bath" | "grooming" | "clothing" | "belongings" | "other";

export type PersistedMorningTaskTemplate = Readonly<{
  id: string;
  name: string;
  normalDurationMin: number;
  minimumDurationMin: number;
  requirement: TaskRequirement;
  compressionPriority: number;
  skipPriority: number;
  sortOrder: number;
  enabled: boolean;
  specialType?: MorningTaskSpecialType;
  createdAt: Date;
  updatedAt: Date;
}>;
