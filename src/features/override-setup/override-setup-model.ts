import type { DateOverrideSetupInput } from "@/application/override-setup";

export type OverrideDraft = {
  clientId: string;
  targetDate: string;
  overrideType: "cancel" | "replace";
  title: string;
  startTime: string;
  locationLabel: string;
};

export function createEmptyOverride(clientId: string): OverrideDraft {
  return {
    clientId,
    targetDate: "",
    overrideType: "cancel",
    title: "",
    startTime: "08:50",
    locationLabel: "",
  };
}

export function isValidDate(value: string): boolean {
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return false;
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().startsWith(normalized)
  );
}

export function toOverrideInputs(
  drafts: readonly OverrideDraft[],
): readonly DateOverrideSetupInput[] | null {
  const dates = drafts.map(({ targetDate }) => targetDate.trim());
  if (
    dates.some((date) => !isValidDate(date)) ||
    new Set(dates).size !== dates.length
  )
    return null;
  const inputs = drafts.map((draft) => {
    if (draft.overrideType === "cancel") {
      return {
        targetDate: draft.targetDate.trim(),
        overrideType: "cancel" as const,
      };
    }
    if (
      !draft.title.trim() ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.startTime.trim())
    ) {
      return null;
    }
    return {
      targetDate: draft.targetDate.trim(),
      overrideType: "replace" as const,
      title: draft.title,
      startTime: draft.startTime,
      locationLabel: draft.locationLabel,
    };
  });
  if (inputs.some((input) => input === null)) return null;
  return inputs.filter((input) => input !== null);
}
