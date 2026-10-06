import type { CommuteRouteInput } from "@/application/route-setup";
import type { RouteSegmentMode } from "@/domain/planning";

export type SegmentDraft = {
  clientId: string;
  mode: RouteSegmentMode;
  fromLabel: string;
  toLabel: string;
  lineName: string;
  durationMin: string;
};

export function createEmptySegment(clientId: string): SegmentDraft {
  return {
    clientId,
    mode: "walk",
    fromLabel: "",
    toLabel: "",
    lineName: "",
    durationMin: "",
  };
}

export function isValidDuration(value: string): boolean {
  const durationText = value.trim();
  if (!/^\d+$/.test(durationText)) return false;
  return Number(durationText) <= 1440;
}

export function createCommuteRouteInput(
  name: string,
  segments: readonly SegmentDraft[],
): CommuteRouteInput | null {
  const parsedSegments = segments.map((segment) => {
    const durationText = segment.durationMin.trim();
    if (!isValidDuration(durationText)) return null;
    return {
      mode: segment.mode,
      fromLabel: segment.fromLabel,
      toLabel: segment.toLabel,
      lineName: segment.lineName,
      durationMin: Number(durationText),
    };
  });
  if (parsedSegments.some((segment) => segment === null)) return null;
  return {
    name,
    segments: parsedSegments.filter((segment) => segment !== null),
  };
}

export function hasMissingRequiredLabels(
  segments: readonly SegmentDraft[],
): boolean {
  return segments.some(
    (segment) => !segment.fromLabel.trim() || !segment.toLabel.trim(),
  );
}
