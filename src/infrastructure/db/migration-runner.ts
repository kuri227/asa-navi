import { RepositoryError } from "@/application/errors/repository-error";

import type { Migration } from "./migrations";

type AppliedMigrationRow = Readonly<{ version: number }>;

export interface MigrationTransaction {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    params?: Readonly<Record<string, string | number | null>>,
  ): Promise<unknown>;
}

export interface MigrationDatabase extends MigrationTransaction {
  getAllAsync<T>(sql: string): Promise<T[]>;
  withExclusiveTransactionAsync(
    task: (transaction: MigrationTransaction) => Promise<void>,
  ): Promise<void>;
}

const CREATE_MIGRATION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);
`;

export async function runMigrations(
  database: MigrationDatabase,
  migrations: readonly Migration[],
  now: () => Date,
): Promise<void> {
  try {
    await database.execAsync(
      "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;",
    );
    await database.execAsync(CREATE_MIGRATION_TABLE_SQL);

    const rows = await database.getAllAsync<AppliedMigrationRow>(
      "SELECT version FROM schema_migrations ORDER BY version ASC",
    );
    const appliedVersions = new Set(rows.map((row) => row.version));

    for (const migration of migrations) {
      if (appliedVersions.has(migration.version)) {
        continue;
      }

      await database.withExclusiveTransactionAsync(async (transaction) => {
        await transaction.execAsync(migration.sql);
        await transaction.runAsync(
          `INSERT INTO schema_migrations (version, name, applied_at)
           VALUES ($version, $name, $appliedAt)`,
          {
            $version: migration.version,
            $name: migration.name,
            $appliedAt: now().toISOString(),
          },
        );
      });
    }
  } catch (cause) {
    throw new RepositoryError(
      "migration_failed",
      "データベースの更新に失敗しました。",
      cause,
    );
  }
}
