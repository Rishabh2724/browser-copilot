import type { BorrowerProfile } from "../types/borrower";
import { AFFORDABILITY_RULES } from "../rules/thresholds";

export function getNormalizedIncome(
  profile: BorrowerProfile
): number {
  const average =
    (profile.monthlyIncome.min +
      profile.monthlyIncome.max) / 2;

  const haircut =
    AFFORDABILITY_RULES.incomeHaircut[
      profile.monthlyIncome.stability
    ];

  return average * haircut;
}