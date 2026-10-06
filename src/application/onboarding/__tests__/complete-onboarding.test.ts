import type {
  AppSettings,
  SettingsRepository,
} from "@/application/ports/repositories";

import { completeOnboarding } from "../complete-onboarding";

const original: AppSettings = {
  arrivalBufferMin: 15,
  tightThresholdMin: 8,
  onboardingCompleted: false,
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  updatedAt: new Date("2026-10-01T00:00:00.000Z"),
};

it("marks onboarding complete while preserving planning settings", async () => {
  const repository: SettingsRepository = {
    get: jest.fn().mockResolvedValue(original),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const completedAt = new Date("2026-10-06T03:00:00.000Z");

  await completeOnboarding(repository, () => completedAt);

  expect(repository.save).toHaveBeenCalledWith({
    ...original,
    onboardingCompleted: true,
    updatedAt: completedAt,
  });
});
