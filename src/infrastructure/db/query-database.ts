import type { SQLiteBindParams, SQLiteDatabase } from "expo-sqlite";

import { withDatabaseTransaction } from "./database-transaction";

export interface QueryDatabase {
  getFirstAsync<T>(sql: string, params?: SQLiteBindParams): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: SQLiteBindParams): Promise<T[]>;
}

export interface WriteDatabase extends QueryDatabase {
  runAsync(sql: string, params?: SQLiteBindParams): Promise<unknown>;
}

export interface MutationDatabase extends WriteDatabase {
  withExclusiveTransactionAsync(
    task: (transaction: WriteDatabase) => Promise<void>,
  ): Promise<void>;
}

export function createQueryDatabase(
  database: Pick<SQLiteDatabase, "getFirstAsync" | "getAllAsync">,
): QueryDatabase {
  return {
    getFirstAsync: <T>(sql: string, params?: SQLiteBindParams) =>
      params
        ? database.getFirstAsync<T>(sql, params)
        : database.getFirstAsync<T>(sql),
    getAllAsync: <T>(sql: string, params?: SQLiteBindParams) =>
      params
        ? database.getAllAsync<T>(sql, params)
        : database.getAllAsync<T>(sql),
  };
}

export function createMutationDatabase(
  database: SQLiteDatabase,
): MutationDatabase {
  return {
    ...createWriteAdapter(database),
    withExclusiveTransactionAsync: (task) =>
      withDatabaseTransaction(database, (transaction) =>
        task(createWriteAdapter(transaction)),
      ),
  };
}

// Repositories participating in a larger write must share its connection and
// let the outer transaction commit or roll back the entire operation.
export async function runMutationTransaction<T>(
  database: SQLiteDatabase,
  task: (transaction: MutationDatabase) => Promise<T>,
): Promise<T> {
  let result: { value: T } | undefined;
  await withDatabaseTransaction(database, async (connection) => {
    const adapter = createWriteAdapter(connection);
    result = {
      value: await task({
        ...adapter,
        withExclusiveTransactionAsync: (write) => write(adapter),
      }),
    };
  });
  if (!result) throw new Error("Transaction callback did not return a result.");
  return result.value;
}

function createWriteAdapter(
  target: Pick<SQLiteDatabase, "getFirstAsync" | "getAllAsync" | "runAsync">,
): WriteDatabase {
  return {
    ...createQueryDatabase(target),
    runAsync: (sql, params) =>
      params ? target.runAsync(sql, params) : target.runAsync(sql),
  };
}
