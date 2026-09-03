import type { BorrowerProfile } from "../types/borrower";
import { calculateAffordability } from "./affordability";

export function runIncomeStressTest(
  profile: BorrowerProfile,
  proposedEmi: number
) {
  const affordability =
    calculateAffordability(profile);

  const stressedIncome =
    affordability.normalizedIncome * 0.8;

  const stressedRatio =
    proposedEmi / stressedIncome;

  let status:
    | "safe"
    | "tight"
    | "unsafe";

  if (stressedRatio <= 0.30) {
    status = "safe";
  } else if (stressedRatio <= 0.40) {
    status = "tight";
  } else {
    status = "unsafe";
  }

  return {
    scenario: "Income falls by 20%",
    baselineEmi: proposedEmi,
    stressedIncome,
    stressedRatio,
    affordabilityStatus: status,
    explanation:
      `After a 20% income reduction, the proposed EMI would consume approximately ${(stressedRatio * 100).toFixed(0)}% of normalized income.`,
  };
}