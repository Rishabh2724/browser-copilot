import type { BorrowerProfile } from "../types/borrower";
import { calculateAffordability } from "./affordability";
import { STRESS_RULES } from "../rules/thresholds";

export function runIncomeStressTest(
  profile: BorrowerProfile,
  proposedEmi: number
) {
  const affordability = calculateAffordability(profile);

  const stressedIncome =
    affordability.normalizedIncome *
    (1 - STRESS_RULES.incomeDrop);

  const stressedTotalEmi =
    affordability.existingEmi + proposedEmi;

  const stressedFoIR =
    stressedIncome > 0
      ? stressedTotalEmi / stressedIncome
      : 1;

  let status:
    | "safe"
    | "tight"
    | "unsafe";

  if (stressedFoIR <= 0.30) {
    status = "safe";
  } else if (stressedFoIR <= 0.40) {
    status = "tight";
  } else {
    status = "unsafe";
  }

  return {
    scenario: "Income falls by 20%",
    baselineEmi: proposedEmi,
    stressedEmi: proposedEmi,
    stressedIncome: Math.round(stressedIncome),
    stressedFoIR: Number(
      stressedFoIR.toFixed(2)
    ),
    affordabilityStatus: status,
    explanation:
      `If income falls by 20%, existing EMI plus the proposed EMI would consume approximately ${(stressedFoIR * 100).toFixed(0)}% of normalized income.`,
  };
}