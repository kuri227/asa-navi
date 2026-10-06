import { ValidationError } from "@/application/errors/validation-error";
import type { WeekdayScheduleSetupInput } from "@/application/schedule-setup";
import { saveWeekdaySchedules } from "@/application/schedule-setup";
import { openAppDatabase } from "@/infrastructure/db/open-database";
import { createMutationDatabase } from "@/infrastructure/db/query-database";
import {
  SQLiteRouteRepository,
  SQLiteScheduleRepository,
} from "@/infrastructure/db/repositories";

import { createLocalId } from "./create-local-id";

export async function saveWeekdaySchedulesToDatabase(
  input: readonly WeekdayScheduleSetupInput[],
): Promise<void> {
  const database = await openAppDatabase();
  try {
    const mutationDatabase = createMutationDatabase(database);
    const defaultRoute = await new SQLiteRouteRepository(
      mutationDatabase,
    ).getDefaultRoute();
    if (!defaultRoute) {
      throw new ValidationError(
        "通学ルートが見つかりません。前の画面でルートを保存してください。",
      );
    }
    await saveWeekdaySchedules(input, {
      repository: new SQLiteScheduleRepository(mutationDatabase),
      routeId: defaultRoute.id,
      createId: createLocalId,
    });
  } finally {
    await database.closeAsync();
  }
}
