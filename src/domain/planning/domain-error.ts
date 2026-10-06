export type PlanningDomainErrorCode =
  | "INVALID_DATE"
  | "INVALID_DURATION"
  | "INVALID_PRIORITY"
  | "DUPLICATE_ID"
  | "INVALID_TASK_DURATION_RANGE";

export class PlanningDomainError extends Error {
  readonly code: PlanningDomainErrorCode;

  constructor(code: PlanningDomainErrorCode, message: string) {
    super(message);
    this.name = "PlanningDomainError";
    this.code = code;
  }
}
