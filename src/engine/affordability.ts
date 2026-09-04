import type { BorrowerProfile } from "../types/borrower";
import { AFFORDABILITY_RULES } from "../rules/thresholds";
import { getNormalizedIncome } from "./income";

export interface AffordabilityResult {
  /** Borrower income after the existing stability haircut. */
  borrowerIncome: number;

  otherHouseholdIncome: number;

  /** Income used for household affordability, not lender sanction. */
  householdIncome: number;

  /** Kept for compatibility; this is normalized borrower income. */
  normalizedIncome: number;

  householdExpenses: number;

  existingEmi: number;

  disposableIncome: number;

  lenderTotalEmiCapacity: number;

  lenderNewEmiCapacity: number;

  safeTotalEmiCapacity: number;

  safeNewEmiCapacity: number;

  expenseConstrainedEmi: number;
}

export function calculateAffordability(
  profile: BorrowerProfile
): AffordabilityResult {
  const normalizedIncome =
    getNormalizedIncome(profile);

  const borrowerIncome = normalizedIncome;

  const otherHouseholdIncome =
    profile.otherHouseholdIncome?.monthly ?? 0;

  const householdIncome =
    borrowerIncome + otherHouseholdIncome;

  const lenderFoIR =
    AFFORDABILITY_RULES.lenderFoIR[
      profile.employmentType
    ];

  const safeFoIR =
    AFFORDABILITY_RULES.safeFoIR[
      profile.employmentType
    ];

  const existingEmi =
    profile.existingLoans.reduce(
      (total, loan) => total + loan.emi,
      0
    );

  const householdExpenses =
    profile.monthlyHouseholdExpenses;

  const disposableIncome =
    Math.max(
      0,
      householdIncome -
        householdExpenses -
        existingEmi
    );

  const lenderTotalEmiCapacity =
    normalizedIncome * lenderFoIR;

  const lenderNewEmiCapacity =
    Math.max(
      0,
      lenderTotalEmiCapacity - existingEmi
    );

  const safeTotalEmiCapacity =
    householdIncome * safeFoIR;

  const safeFoIRCapacity =
    Math.max(
      0,
      safeTotalEmiCapacity - existingEmi
    );

  // Keep at least 50% of post-expense cash flow
  // available for non-loan needs and uncertainty.
  const expenseConstrainedEmi =
    disposableIncome * 0.5;

  const safeNewEmiCapacity =
    Math.min(
      safeFoIRCapacity,
      expenseConstrainedEmi
    );

  return {
    borrowerIncome,

    otherHouseholdIncome,

    householdIncome,

    normalizedIncome,

    householdExpenses,

    existingEmi,

    disposableIncome,

    lenderTotalEmiCapacity,

    lenderNewEmiCapacity,

    safeTotalEmiCapacity,

    safeNewEmiCapacity,

    expenseConstrainedEmi,
  };
}
