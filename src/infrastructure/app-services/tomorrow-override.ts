import type { DateScheduleOverride } from "@/application/schedule";
import {
  restoreWeekdaySchedule,
  saveTomorrowOverride,
  type TomorrowOverrideInput,
} from "@/application/tomorrow-override";
import { ValidationError } from "@/application/errors/validation-error";
import { openAppDatabase } from "@/infrastructure/db/open-database";
import { createMutationDatabase } from "@/infrastructure/db/query-database";
import {
  SQLiteRouteRepository,
  SQLiteScheduleRepository,
} from "@/infrastructure/db/repositories";

import { createLocalId } from "./create-local-id";

export async function loadTomorrowOverrideFromDatabase(
  targetDate: string,
): Promise<DateScheduleOverride | null> {
  const database = await openAppDatabase();
  try {
    const repository = new SQLiteScheduleRepository(
      createMutationDatabase(database),
    );
    return await repository.getOverride(targetDate);
  } finally {
    await database.closeAsync();
  }
}

export async function saveTomorrowOverrideToDatabase(
  input: TomorrowOverrideInput,
): Promise<void> {
  const database = await openAppDatabase();
  try {
    const mutationDatabase = createMutationDatabase(database);
    const route = await new SQLiteRouteRepository(
      mutationDatabase,
    ).getDefaultRoute();
    if (!route) throw new ValidationError("通学ルートが見つかりません。");
    await saveTomorrowOverride(input, {
      repository: new SQLiteScheduleRepository(mutationDatabase),
      routeId: route.id,
      createId: createLocalId,
    });
  } finally {
    await database.closeAsync();
  }
}

export async function restoreTomorrowWeekdayScheduleInDatabase(
  targetDate: string,
): Promise<void> {
  const database = await openAppDatabase();
  try {
    await restoreWeekdaySchedule(
      targetDate,
      new SQLiteScheduleRepository(createMutationDatabase(database)),
    );
  } finally {
    await database.closeAsync();
  }
}
