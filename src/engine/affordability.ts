import type { BorrowerProfile } from "../types/borrower";
import { AFFORDABILITY_RULES } from "../rules/thresholds";
import { getNormalizedIncome } from "./income";

export interface AffordabilityResult {
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
      normalizedIncome -
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
    normalizedIncome * safeFoIR;

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