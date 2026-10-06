import type { MorningRoutineTaskInput } from "@/application/routine-setup";

export type RoutineTaskDraft = Readonly<{
  clientId: string;
  name: string;
  normalDurationMin: string;
  minimumDurationMin: string;
  requirement: "required" | "optional";
  specialType?: MorningRoutineTaskInput["specialType"];
}>;

export type RoutinePreset = Readonly<{
  label: string;
  task: Omit<RoutineTaskDraft, "clientId">;
}>;

export const routinePresets: readonly RoutinePreset[] = [
  {
    label: "朝食",
    task: {
      name: "朝食",
      normalDurationMin: "15",
      minimumDurationMin: "8",
      requirement: "required",
      specialType: "meal",
    },
  },
  {
    label: "身支度",
    task: {
      name: "身支度",
      normalDurationMin: "10",
      minimumDurationMin: "5",
      requirement: "required",
      specialType: "grooming",
    },
  },
  {
    label: "着替え",
    task: {
      name: "着替え",
      normalDurationMin: "10",
      minimumDurationMin: "5",
      requirement: "required",
      specialType: "clothing",
    },
  },
  {
    label: "持ち物確認",
    task: {
      name: "持ち物確認",
      normalDurationMin: "5",
      minimumDurationMin: "3",
      requirement: "optional",
      specialType: "belongings",
    },
  },
] as const;

export function createCustomTask(clientId: string): RoutineTaskDraft {
  return {
    clientId,
    name: "",
    normalDurationMin: "10",
    minimumDurationMin: "5",
    requirement: "required",
    specialType: "other",
  };
}

export function createPresetTask(
  clientId: string,
  preset: RoutinePreset,
): RoutineTaskDraft {
  return { clientId, ...preset.task };
}

function parseDuration(value: string): number | undefined {
  if (!/^\d+$/.test(value.trim())) return undefined;
  const duration = Number(value);
  return Number.isSafeInteger(duration) ? duration : undefined;
}

export function taskError(draft: RoutineTaskDraft): string | undefined {
  const normalDurationMin = parseDuration(draft.normalDurationMin);
  const minimumDurationMin = parseDuration(draft.minimumDurationMin);
  if (!draft.name.trim()) return "タスク名を入力してください。";
  if (!normalDurationMin || normalDurationMin > 1440)
    return "通常時間は1〜1440分で入力してください。";
  if (minimumDurationMin === undefined || minimumDurationMin > 1440)
    return "最短時間は0〜1440分で入力してください。";
  if (minimumDurationMin > normalDurationMin)
    return "最短時間は通常時間以下にしてください。";
  return undefined;
}

export function toRoutineInputs(
  drafts: readonly RoutineTaskDraft[],
): readonly MorningRoutineTaskInput[] | undefined {
  if (drafts.length === 0 || drafts.some(taskError)) return undefined;
  return drafts.map((draft) => ({
    name: draft.name.trim(),
    normalDurationMin: Number(draft.normalDurationMin),
    minimumDurationMin: Number(draft.minimumDurationMin),
    requirement: draft.requirement,
    specialType: draft.specialType,
  }));
}

export function moveTask(
  drafts: readonly RoutineTaskDraft[],
  fromIndex: number,
  toIndex: number,
): RoutineTaskDraft[] {
  if (toIndex < 0 || toIndex >= drafts.length) return [...drafts];
  const next = [...drafts];
  const [task] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, task);
  return next;
}
