import type { SettingsRepository } from "@/application/ports/repositories";

export async function completeOnboarding(
  repository: SettingsRepository,
  now: () => Date,
): Promise<void> {
  const current = await repository.get();
  await repository.save({
    ...current,
    onboardingCompleted: true,
    updatedAt: now(),
  });
}
