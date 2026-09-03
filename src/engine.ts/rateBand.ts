import type { BorrowerProfile } from "../types/borrower";
import { PRODUCT_RULES } from "../rules/productRules";
import { getCreditAdjustment } from "../rules/rateRules";

export interface RateResult {
  fairRate: {
    min: number;
    max: number;
  };

  reasons: string[];
}

export function calculateFairRate(
  profile: BorrowerProfile
): RateResult {
  const product =
    PRODUCT_RULES[profile.loan.type];

  let adjustment =
    getCreditAdjustment(profile.creditScore);

  const reasons: string[] = [];

  if (
    profile.monthlyIncome.stability ===
    "highly_variable"
  ) {
    adjustment += 1.0;

    reasons.push(
      "Income has high month-to-month variability."
    );
  }

  if (
    profile.existingLoans.length > 0
  ) {
    adjustment += 0.25;

    reasons.push(
      "Existing debt increases repayment risk."
    );
  }

  if (
    product.secured &&
    profile.collateral?.available
  ) {
    adjustment -= 0.75;

    reasons.push(
      "Available collateral can reduce lender risk."
    );
  }

  const min = Math.max(
    5,
    product.baseRate.min + adjustment
  );

  const max =
    product.baseRate.max + adjustment;

  return {
    fairRate: {
      min: Number(min.toFixed(2)),
      max: Number(max.toFixed(2)),
    },
    reasons,
  };
}