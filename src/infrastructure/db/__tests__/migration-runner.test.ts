import { RepositoryError } from "@/application/errors/repository-error";

import {
  type MigrationDatabase,
  type MigrationTransaction,
  runMigrations,
} from "../migration-runner";
import type { Migration } from "../migrations";

class FakeMigrationDatabase implements MigrationDatabase {
  readonly executedSql: string[] = [];
  readonly appliedVersions = new Set<number>();
  failOnMigration = false;

  async execAsync(sql: string): Promise<void> {
    this.executedSql.push(sql);
  }

  async runAsync(
    _sql: string,
    params?: Readonly<Record<string, string | number | null>>,
  ): Promise<void> {
    const version = params?.$version;
    if (typeof version === "number") {
      this.appliedVersions.add(version);
    }
  }

  async getAllAsync<T>(_sql: string): Promise<T[]> {
    return [...this.appliedVersions].map((version) => ({ version })) as T[];
  }

  async withExclusiveTransactionAsync(
    task: (transaction: MigrationTransaction) => Promise<void>,
  ): Promise<void> {
    if (this.failOnMigration) {
      throw new Error("simulated migration failure");
    }
    await task(this);
  }
}

const migration: Migration = {
  version: 1,
  name: "initial_schema",
  sql: "CREATE TABLE example (id TEXT PRIMARY KEY);",
};

describe("runMigrations", () => {
  it("applies each pending migration exactly once", async () => {
    const database = new FakeMigrationDatabase();
    const now = () => new Date("2026-10-06T00:00:00.000Z");

    await runMigrations(database, [migration], now);
    await runMigrations(database, [migration], now);

    expect(database.appliedVersions).toEqual(new Set([1]));
    expect(
      database.executedSql.filter((sql) => sql === migration.sql),
    ).toHaveLength(1);
  });

  it("wraps migration failures without hiding their cause", async () => {
    const database = new FakeMigrationDatabase();
    database.failOnMigration = true;

    await expect(
      runMigrations(
        database,
        [migration],
        () => new Date("2026-10-06T00:00:00.000Z"),
      ),
    ).rejects.toMatchObject<Partial<RepositoryError>>({
      name: "RepositoryError",
      code: "migration_failed",
      cause: expect.any(Error),
    });

    expect(database.appliedVersions.size).toBe(0);
  });
});
