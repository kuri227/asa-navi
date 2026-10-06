import type { SQLiteBindParams, SQLiteDatabase } from "expo-sqlite";

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
  const createWriteAdapter = (
    target: Pick<SQLiteDatabase, "getFirstAsync" | "getAllAsync" | "runAsync">,
  ): WriteDatabase => ({
    ...createQueryDatabase(target),
    runAsync: (sql, params) =>
      params ? target.runAsync(sql, params) : target.runAsync(sql),
  });
  return {
    ...createWriteAdapter(database),
    withExclusiveTransactionAsync: (task) =>
      database.withExclusiveTransactionAsync((transaction) =>
        task(createWriteAdapter(transaction)),
      ),
  };
}
