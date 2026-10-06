import type { SQLiteBindParams, SQLiteDatabase } from "expo-sqlite";

export interface QueryDatabase {
  getFirstAsync<T>(sql: string, params?: SQLiteBindParams): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: SQLiteBindParams): Promise<T[]>;
}

export function createQueryDatabase(database: SQLiteDatabase): QueryDatabase {
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
