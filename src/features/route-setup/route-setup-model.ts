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

export function findDraftPlaceMatches(
  query: string,
  placeLabels: readonly string[],
): string[] {
  const normalizedQuery = normalizePlaceLabel(query);
  if (!normalizedQuery) return [];

  const seen = new Set([normalizedQuery]);
  const prefixMatches: string[] = [];
  const otherMatches: string[] = [];
  for (const label of placeLabels) {
    const normalizedLabel = normalizePlaceLabel(label);
    if (
      seen.has(normalizedLabel) ||
      !normalizedLabel.includes(normalizedQuery)
    ) {
      continue;
    }
    seen.add(normalizedLabel);
    const matches = normalizedLabel.startsWith(normalizedQuery)
      ? prefixMatches
      : otherMatches;
    matches.push(label.trim());
  }
  return [...prefixMatches, ...otherMatches].slice(0, 3);
}

function normalizePlaceLabel(label: string): string {
  return label.normalize("NFKC").trim().toLowerCase();
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
