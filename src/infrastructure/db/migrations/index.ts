import { INITIAL_SCHEMA_SQL } from "./001-initial-schema";

export type Migration = Readonly<{
  version: number;
  name: string;
  sql: string;
}>;

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: "initial_schema",
    sql: INITIAL_SCHEMA_SQL,
  },
];
