import { QuarterDecisionInput, SimulationResult } from "../types/game";

export const SALARY_PCT_MIN = 50;
export const SALARY_PCT_MAX = 300;

type CurrentState = {
  cash: number;
  engineers: number;
  salesStaff: number;
  quality: number;
  year: number;
  quarter: number;
};

export function validateDecisionInput(input: QuarterDecisionInput): string | null {
  if (!Number.isFinite(input.price) || input.price <= 0) {
    return "Price must be greater than 0.";
  }
  if (!Number.isInteger(input.newEngineers) || input.newEngineers < 0) {
    return "Engineers to hire must be a non-negative integer.";
  }
  if (!Number.isInteger(input.newSales) || input.newSales < 0) {
    return "Sales staff to hire must be a non-negative integer.";
  }
  if (!Number.isFinite(input.salaryPct) || input.salaryPct < SALARY_PCT_MIN || input.salaryPct > SALARY_PCT_MAX) {
    return `Salary percentage must be between ${SALARY_PCT_MIN} and ${SALARY_PCT_MAX}.`;
  }
  return null;
}

export function simulateQuarter(
  current: CurrentState,
  decision: QuarterDecisionInput
): SimulationResult {
  const salaryCost = (decision.salaryPct / 100) * 30000;
  const quality = Math.min(current.quality + current.engineers * 0.5, 100);
  const demand = Math.max(quality * 10 - decision.price * 0.0001, 0);
  const units = Math.floor(demand * current.salesStaff * 0.5);
  const revenue = decision.price * units;
  const payroll = salaryCost * (current.engineers + current.salesStaff);
  const netIncome = revenue - payroll;

  let cash = current.cash + netIncome;
  const hireCost = (decision.newEngineers + decision.newSales) * 5000;
  cash -= hireCost;

  const engineers = current.engineers + decision.newEngineers;
  const salesStaff = current.salesStaff + decision.newSales;

  let nextQuarter = current.quarter + 1;
  let nextYear = current.year;
  if (nextQuarter > 4) {
    nextQuarter = 1;
    nextYear += 1;
  }

  let status: "ongoing" | "won" | "lost" = "ongoing";
  if (cash <= 0) {
    status = "lost";
  } else if (nextYear >= 10 && cash > 0) {
    status = "won";
  }

  return {
    revenue,
    netIncome,
    cash,
    engineers,
    salesStaff,
    quality,
    completedYear: current.year,
    completedQuarter: current.quarter,
    nextYear,
    nextQuarter,
    isOver: status !== "ongoing",
    status
  };
}
