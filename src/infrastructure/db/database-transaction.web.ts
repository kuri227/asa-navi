import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

// A dedicated connection keeps unrelated queries out of this transaction.
// Expo's native exclusive-transaction helper is unavailable on Web.
export async function withDatabaseTransaction(
  database: Pick<SQLiteDatabase, "databasePath" | "options">,
  task: (transaction: SQLiteDatabase) => Promise<void>,
): Promise<void> {
  const name = database.databasePath.split("/").at(-1);
  if (!name) {
    throw new Error("Database filename is missing.");
  }
  const transaction = await openDatabaseAsync(name, {
    ...database.options,
    useNewConnection: true,
  });
  try {
    await transaction.execAsync("PRAGMA foreign_keys = ON");
    await transaction.withTransactionAsync(() => task(transaction));
  } finally {
    await transaction.closeAsync();
  }
}
