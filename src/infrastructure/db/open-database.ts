import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

import { RepositoryError } from "@/application/errors/repository-error";

import {
  type MigrationDatabase,
  type MigrationTransaction,
  runMigrations,
} from "./migration-runner";
import { MIGRATIONS } from "./migrations";

export const DATABASE_NAME = "asanavi.db";

function createMigrationAdapter(database: SQLiteDatabase): MigrationDatabase {
  const createTransactionAdapter = (
    transaction: SQLiteDatabase,
  ): MigrationTransaction => ({
    execAsync: (sql) => transaction.execAsync(sql),
    runAsync: (sql, params) =>
      params ? transaction.runAsync(sql, params) : transaction.runAsync(sql),
  });

  return {
    ...createTransactionAdapter(database),
    getAllAsync: <T>(sql: string) => database.getAllAsync<T>(sql),
    withExclusiveTransactionAsync: (task) =>
      database.withExclusiveTransactionAsync((transaction) =>
        task(createTransactionAdapter(transaction)),
      ),
  };
}

export async function openAppDatabase(): Promise<SQLiteDatabase> {
  let database: SQLiteDatabase | undefined;

  try {
    database = await openDatabaseAsync(DATABASE_NAME);
    await runMigrations(
      createMigrationAdapter(database),
      MIGRATIONS,
      () => new Date(),
    );
    return database;
  } catch (cause) {
    await database?.closeAsync().catch(() => undefined);

    if (cause instanceof RepositoryError) {
      throw cause;
    }

    throw new RepositoryError(
      "open_failed",
      "データベースを開けませんでした。",
      cause,
    );
  }
}
