import type { SQLiteDatabase } from "expo-sqlite";

export function withDatabaseTransaction(
  database: SQLiteDatabase,
  task: (transaction: SQLiteDatabase) => Promise<void>,
): Promise<void> {
  return database.withExclusiveTransactionAsync(task);
}
