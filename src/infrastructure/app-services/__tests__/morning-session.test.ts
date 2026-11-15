import { completeMorningTask } from "@/application/morning-session";
import { openAppDatabase } from "@/infrastructure/db/open-database";
import { withDatabaseTransaction } from "@/infrastructure/db/database-transaction";

import { completeMorningTaskInDatabase } from "../morning-session";

jest.mock("@/application/morning-session", () => ({
  completeMorningTask: jest.fn(),
}));
jest.mock("@/infrastructure/db/open-database", () => ({
  openAppDatabase: jest.fn(),
}));
jest.mock("@/infrastructure/db/database-transaction", () => ({
  withDatabaseTransaction: jest.fn(),
}));

it("rolls back the task outcome when rebuilding the rest of the session fails", async () => {
  const persistedWrites: string[] = [];
  const closeAsync = jest.fn(async () => undefined);
  const database = {
    databasePath: "/app/asanavi.db",
    options: {},
    closeAsync,
    runAsync: jest.fn(async (sql: string) => {
      persistedWrites.push(sql);
    }),
  };
  jest
    .mocked(openAppDatabase)
    .mockResolvedValue(
      database as unknown as Awaited<ReturnType<typeof openAppDatabase>>,
    );
  jest
    .mocked(withDatabaseTransaction)
    .mockImplementation(async (_database, operation) => {
      const stagedWrites: string[] = [];
      const transaction = {
        ...database,
        runAsync: jest.fn(async (sql: string) => {
          stagedWrites.push(sql);
        }),
      };
      await operation(
        transaction as unknown as Awaited<ReturnType<typeof openAppDatabase>>,
      );
      persistedWrites.push(...stagedWrites);
    });
  const cause = new Error("replan failed after marking the task complete");
  jest
    .mocked(completeMorningTask)
    .mockImplementation(async (input, dependencies) => {
      await dependencies.executionRepository.save({
        id: input.executionId,
        sessionId: input.sessionId,
        taskTemplateId: "template",
        sortOrder: 0,
        plannedDurationMin: 3,
        plannedAction: "normal",
        status: "completed",
        createdAt: input.now,
        updatedAt: input.now,
      });
      // Replacing executions is already transaction-wrapped at repository level.
      await dependencies.executionRepository.replaceForSession(
        input.sessionId,
        [],
      );
      throw cause;
    });

  await expect(
    completeMorningTaskInDatabase("session", "execution"),
  ).rejects.toBe(cause);
  expect(persistedWrites).toEqual([]);
  expect(withDatabaseTransaction).toHaveBeenCalledTimes(1);
  expect(closeAsync).toHaveBeenCalledTimes(1);
});
