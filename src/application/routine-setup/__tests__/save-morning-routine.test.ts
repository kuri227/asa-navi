import type {
  PersistedMorningTaskTemplate,
  RoutineRepository,
} from "@/application/ports/repositories";
import type { MorningTaskTemplate } from "@/domain/planning";
import { saveMorningRoutine } from "../save-morning-routine";

class FakeRoutineRepository implements RoutineRepository {
  saved: readonly PersistedMorningTaskTemplate[] | undefined;
  listEnabledTasks(): Promise<MorningTaskTemplate[]> {
    return Promise.resolve([]);
  }
  listTaskTemplates(): Promise<PersistedMorningTaskTemplate[]> {
    return Promise.resolve([]);
  }
  replaceTaskTemplates(
    tasks: readonly PersistedMorningTaskTemplate[],
  ): Promise<void> {
    this.saved = tasks;
    return Promise.resolve();
  }
}

describe("saveMorningRoutine", () => {
  it("assigns priorities and sort order from the user order", async () => {
    const repository = new FakeRoutineRepository();
    let id = 0;
    const result = await saveMorningRoutine(
      [
        {
          name: "朝食",
          normalDurationMin: 15,
          minimumDurationMin: 8,
          requirement: "required",
          specialType: "meal",
        },
        {
          name: "持ち物確認",
          normalDurationMin: 5,
          minimumDurationMin: 2,
          requirement: "optional",
          specialType: "belongings",
        },
      ],
      {
        repository,
        createId: () => `task-${(id += 1)}`,
        now: () => new Date("2026-10-06T00:00:00.000Z"),
      },
    );
    expect(result).toMatchObject([
      { id: "task-1", name: "朝食", sortOrder: 0, compressionPriority: 0 },
      { id: "task-2", name: "持ち物確認", sortOrder: 1, skipPriority: 1 },
    ]);
    expect(repository.saved).toEqual(result);
  });

  it("rejects a minimum duration greater than normal duration", async () => {
    const repository = new FakeRoutineRepository();
    await expect(
      saveMorningRoutine(
        [
          {
            name: "朝食",
            normalDurationMin: 5,
            minimumDurationMin: 6,
            requirement: "required",
          },
        ],
        { repository, createId: () => "id", now: () => new Date() },
      ),
    ).rejects.toThrow("朝ルーティンの入力内容を確認してください。");
    expect(repository.saved).toBeUndefined();
  });
});
