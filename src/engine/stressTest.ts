import type { BorrowerProfile } from "../types/borrower";
import { calculateAffordability } from "./affordability";
import { STRESS_RULES } from "../rules/thresholds";

export function runIncomeStressTest(
  profile: BorrowerProfile,
  proposedEmi: number
) {
  const affordability =
    calculateAffordability(profile);

  const stressedIncome =
    affordability.householdIncome *
    (1 - STRESS_RULES.incomeDrop);

  const stressedTotalEmi =
    affordability.existingEmi +
    Math.max(0, proposedEmi);

  const stressedFoIR =
    stressedIncome > 0
      ? stressedTotalEmi /
        stressedIncome
      : 1;

  let status:
    | "safe"
    | "tight"
    | "unsafe";

  if (proposedEmi <= 0) {
    status = "unsafe";
  } else if (stressedFoIR <= 0.30) {
    status = "safe";
  } else if (stressedFoIR <= 0.40) {
    status = "tight";
  } else {
    status = "unsafe";
  }

  const explanation =
    proposedEmi <= 0
      ? "Not meaningful for new borrowing. There is currently no conservative capacity for an additional EMI, and a 20% income decline would further reduce available cash flow."
      : `If household income falls by 20%, existing EMI plus the proposed EMI would consume approximately ${(stressedFoIR * 100).toFixed(0)}% of household income.`;

  return {
    scenario: "Income falls by 20%",
    baselineEmi: Math.round(
      Math.max(0, proposedEmi)
    ),
    stressedEmi: Math.round(
      Math.max(0, proposedEmi)
    ),
    stressedIncome: Math.round(
      stressedIncome
    ),
    stressedFoIR: Number(
      stressedFoIR.toFixed(2)
    ),
    affordabilityStatus: status,
    explanation,
  };
}
