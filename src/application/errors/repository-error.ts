export type RepositoryErrorCode =
  "open_failed" | "migration_failed" | "query_failed" | "mapping_failed";

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;
  override readonly cause?: unknown;

  constructor(code: RepositoryErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "RepositoryError";
    this.code = code;
    this.cause = cause;
  }
}
