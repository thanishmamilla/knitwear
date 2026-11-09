export interface RunRateInput {
  totalQty: number;
  producedQty: number;
  exFactoryDate: Date | string;
  referenceDate?: Date | string; // defaults to now (or 2026-11-09 for deterministic demo testing)
  recentDailyOutputs?: number[]; // past 7 days output
  fallbackActualRate?: number;
}

export type RiskStatus = "GREEN" | "AMBER" | "RED";

export interface RunRateResult {
  totalQty: number;
  producedQty: number;
  remainingQty: number;
  daysLeft: number;
  requiredRate: number; // pieces per day
  actualRate: number; // pieces per day (7-day average)
  difference: number; // actualRate - requiredRate
  ratioPercentage: number; // (actualRate / requiredRate) * 100
  projectedDaysNeeded: number;
  projectedDelayDays: number; // positive = delayed, zero or negative = on-time/ahead
  riskStatus: RiskStatus;
  statusLabel: string;
  mathExplanation: {
    remainingFormula: string;
    daysFormula: string;
    requiredFormula: string;
    actualFormula: string;
    differenceFormula: string;
    projectedFormula: string;
    delayFormula: string;
  };
}

export function calculateRunRate(input: RunRateInput): RunRateResult {
  const total = Math.max(0, input.totalQty);
  const produced = Math.max(0, input.producedQty);
  const remaining = Math.max(0, total - produced);

  const ref = input.referenceDate ? new Date(input.referenceDate) : new Date();
  const target = new Date(input.exFactoryDate);

  // Calculate days left (normalized to start of day)
  const refMidnight = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const diffTime = targetMidnight - refMidnight;
  const rawDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(1, rawDays); // at least 1 day to prevent div by zero

  // Required rate
  const requiredRate = Number((remaining / daysLeft).toFixed(1));

  // Actual rate from last 7 days or provided outputs
  let actualRate = 0;
  if (input.recentDailyOutputs && input.recentDailyOutputs.length > 0) {
    const sum = input.recentDailyOutputs.reduce((acc, curr) => acc + curr, 0);
    actualRate = Number((sum / input.recentDailyOutputs.length).toFixed(1));
  } else if (input.fallbackActualRate !== undefined) {
    actualRate = Number(input.fallbackActualRate.toFixed(1));
  } else {
    // Default estimate if nothing provided
    actualRate = Number((requiredRate * 0.85).toFixed(1));
  }

  // Difference
  const difference = Number((actualRate - requiredRate).toFixed(1));

  // Projected days needed
  const safeActualRate = Math.max(1, actualRate);
  const projectedDaysNeeded = Number((remaining / safeActualRate).toFixed(1));
  const projectedDelayDays = Number((projectedDaysNeeded - daysLeft).toFixed(1));

  // Ratio
  const ratioPercentage = requiredRate > 0 ? Number(((actualRate / requiredRate) * 100).toFixed(1)) : 100;

  // Status rules:
  // GREEN: Actual Rate >= Required Rate
  // AMBER: Actual Rate >= 80% of Required Rate
  // RED: Actual Rate < 80% of Required Rate
  let riskStatus: RiskStatus = "GREEN";
  let statusLabel = "On Schedule";

  if (actualRate >= requiredRate) {
    riskStatus = "GREEN";
    statusLabel = "On Schedule (Actual ≥ Required)";
  } else if (actualRate >= 0.8 * requiredRate) {
    riskStatus = "AMBER";
    statusLabel = "At Risk (Actual is 80%–99% of Required)";
  } else {
    riskStatus = "RED";
    statusLabel = "Critical Delay (Actual < 80% of Required)";
  }

  return {
    totalQty: total,
    producedQty: produced,
    remainingQty: remaining,
    daysLeft,
    requiredRate,
    actualRate,
    difference,
    ratioPercentage,
    projectedDaysNeeded,
    projectedDelayDays,
    riskStatus,
    statusLabel,
    mathExplanation: {
      remainingFormula: `Remaining Qty = ${total.toLocaleString()} - ${produced.toLocaleString()} = ${remaining.toLocaleString()} pcs`,
      daysFormula: `Days Left = ${target.toISOString().split("T")[0]} - ${ref.toISOString().split("T")[0]} = ${daysLeft} days`,
      requiredFormula: `Required Rate = ${remaining.toLocaleString()} pcs ÷ ${daysLeft} days = ${requiredRate.toLocaleString()} pcs/day`,
      actualFormula: `Actual Rate (7-Day Avg) = ${actualRate.toLocaleString()} pcs/day`,
      differenceFormula: `Difference = ${actualRate.toLocaleString()} - ${requiredRate.toLocaleString()} = ${difference > 0 ? "+" : ""}${difference.toLocaleString()} pcs/day (${ratioPercentage}% throughput)`,
      projectedFormula: `Projected Days Needed = ${remaining.toLocaleString()} pcs ÷ ${actualRate.toLocaleString()} pcs/day = ${projectedDaysNeeded} days`,
      delayFormula: `Projected Delay = ${projectedDaysNeeded} days needed - ${daysLeft} days left = ${projectedDelayDays > 0 ? `+${projectedDelayDays} days late` : `${Math.abs(projectedDelayDays)} days early / on time`}`,
    },
  };
}

