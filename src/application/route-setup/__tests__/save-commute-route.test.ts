import { ValidationError } from "@/application/errors/validation-error";
import type {
  CommuteRoute,
  RouteRepository,
  RouteWithSegments,
} from "@/application/ports/repositories";

import { saveCommuteRoute } from "../save-commute-route";

class FakeRouteRepository implements RouteRepository {
  saved: RouteWithSegments | undefined;

  getDefaultRoute(): Promise<CommuteRoute | null> {
    return Promise.resolve(null);
  }

  getRouteWithSegments(): Promise<RouteWithSegments | null> {
    return Promise.resolve(null);
  }

  saveRouteWithSegments(route: RouteWithSegments): Promise<void> {
    this.saved = route;
    return Promise.resolve();
  }
}

describe("saveCommuteRoute", () => {
  const now = new Date("2026-10-06T00:00:00.000Z");

  it("normalizes and orders multiple route segments", async () => {
    const repository = new FakeRouteRepository();
    const ids = ["route-1", "segment-1", "segment-2"];

    const saved = await saveCommuteRoute(
      {
        name: "  大学ルート  ",
        segments: [
          {
            mode: "walk",
            fromLabel: " 自宅 ",
            toLabel: " 吹田駅 ",
            durationMin: 8,
          },
          {
            mode: "train",
            fromLabel: "吹田駅",
            toLabel: "大阪駅",
            lineName: " JR京都線 ",
            durationMin: 12,
          },
        ],
      },
      {
        repository,
        createId: () => ids.shift() ?? "unexpected-id",
        now: () => now,
      },
    );

    expect(saved.route).toMatchObject({
      id: "route-1",
      name: "大学ルート",
      isDefault: true,
    });
    expect(saved.segments).toMatchObject([
      { id: "segment-1", sortOrder: 0, fromLabel: "自宅" },
      {
        id: "segment-2",
        sortOrder: 1,
        lineName: "JR京都線",
      },
    ]);
    expect(repository.saved).toEqual(saved);
  });

  it.each([
    { name: "", segments: [] },
    {
      name: "大学ルート",
      segments: [
        { mode: "walk" as const, fromLabel: "", toLabel: "駅", durationMin: 5 },
      ],
    },
    {
      name: "大学ルート",
      segments: [
        {
          mode: "walk" as const,
          fromLabel: "自宅",
          toLabel: "駅",
          durationMin: -1,
        },
      ],
    },
  ])("rejects invalid boundary input %#", async (input) => {
    const repository = new FakeRouteRepository();

    await expect(
      saveCommuteRoute(input, {
        repository,
        createId: () => "id",
        now: () => now,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(repository.saved).toBeUndefined();
  });
});
