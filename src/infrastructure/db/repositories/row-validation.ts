import { z, type ZodType } from "zod";

import { RepositoryError } from "@/application/errors/repository-error";

export const booleanIntegerSchema = z
  .union([z.literal(0), z.literal(1)])
  .transform(Boolean);
export const isoDateTimeSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));
export const nullableStringSchema = z
  .string()
  .nullable()
  .transform((value) => value ?? undefined);
export const nullableDateTimeSchema = z.iso
  .datetime({ offset: true })
  .nullable()
  .transform((value) => (value === null ? undefined : new Date(value)));

export function parseDatabaseRow<T>(
  schema: ZodType<T>,
  row: unknown,
  entity: string,
): T {
  const result = schema.safeParse(row);
  if (!result.success) {
    throw new RepositoryError(
      "mapping_failed",
      `${entity}の保存データが不正です。`,
      result.error,
    );
  }
  return result.data;
}

export async function runRepositoryQuery<T>(
  query: () => Promise<T>,
): Promise<T> {
  try {
    return await query();
  } catch (cause) {
    if (cause instanceof RepositoryError) {
      throw cause;
    }
    throw new RepositoryError(
      "query_failed",
      "保存データを読み込めませんでした。",
      cause,
    );
  }
}
