import { calculatePlan } from "./calculate-plan";
import type { PlanningInput, PlanningResult } from "./types";

export const replan = (input: PlanningInput): PlanningResult =>
  calculatePlan(input);
