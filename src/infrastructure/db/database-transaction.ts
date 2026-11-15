import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

export async function withDatabaseTransaction(
  database: Pick<SQLiteDatabase, "databasePath" | "options">,
  task: (transaction: SQLiteDatabase) => Promise<void>,
): Promise<void> {
  const path = database.databasePath;
  const separator = path.lastIndexOf("/");
  const name = path.slice(separator + 1);
  if (!name || name === ":memory:") {
    throw new Error("A persistent database filename is required.");
  }

  // The Expo exclusive helper opens a connection and starts BEGIN before we can enable foreign keys.
  const connection = await openDatabaseAsync(
    name,
    { ...database.options, useNewConnection: true },
    separator < 0 ? undefined : path.slice(0, separator) || "/",
  );
  try {
    await connection.execAsync("PRAGMA foreign_keys = ON");
    await connection.withTransactionAsync(() => task(connection));
  } finally {
    await connection.closeAsync();
  }
}
