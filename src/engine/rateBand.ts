import type { BorrowerProfile } from "../types/borrower";

export interface RateBand {
  min: number;
  max: number;
}

export interface RateResult {
  fairRate: RateBand;
  reasons: string[];
}

const PRODUCT_RATE_BANDS: Record<
  BorrowerProfile["loan"]["type"],
  RateBand
> = {
  personal: {
    min: 11,
    max: 16,
  },

  business: {
    min: 11,
    max: 17,
  },

  lap: {
    min: 9,
    max: 13,
  },

  gold: {
    min: 9,
    max: 15,
  },

  two_wheeler: {
    min: 10,
    max: 15,
  },

  home: {
    min: 8,
    max: 11,
  },
};

export function calculateFairRate(
  profile: BorrowerProfile
): RateResult {
  const productBand =
    PRODUCT_RATE_BANDS[profile.loan.type];

  let min = productBand.min;
  let max = productBand.max;

  const reasons: string[] = [];

  /*
   * Credit profile
   */
  if (profile.creditScore !== undefined) {
    if (profile.creditScore >= 750) {
      min -= 1;
      max -= 1.5;

      reasons.push(
        "Your credit score is 750 or above, which supports better-than-base pricing."
      );
    } else if (profile.creditScore >= 700) {
      min -= 0.5;
      max -= 0.75;

      reasons.push(
        "Your credit score is in a good range, which supports somewhat better pricing."
      );
    } else if (profile.creditScore >= 650) {
      reasons.push(
        "Your credit score is in the fair range, so no strong rate discount is assumed."
      );
    } else if (profile.creditScore >= 550) {
      min += 1;
      max += 1.5;

      reasons.push(
        "Your credit score is below 650, which increases the indicative pricing range."
      );
    } else {
      min += 2;
      max += 3;

      reasons.push(
        "A very low credit score materially increases the indicative pricing range."
      );
    }
  } else {
    reasons.push(
      "Credit score is unknown, so no strong rate discount is assumed."
    );
  }

  /*
   * Income stability
   */
  if (
    profile.monthlyIncome.stability ===
    "highly_variable"
  ) {
    min += 1;
    max += 2;

    reasons.push(
      "Highly variable income increases repayment uncertainty, so the rate range is adjusted upward."
    );
  } else if (
    profile.monthlyIncome.stability ===
    "variable"
  ) {
    min += 0.5;
    max += 1;

    reasons.push(
      "Variable income increases repayment uncertainty, so the rate range is adjusted upward."
    );
  } else {
    reasons.push(
      "Stable income supports the base product pricing range."
    );
  }

  /*
   * Existing debt
   */
  const existingEmi =
    profile.existingLoans.reduce(
      (sum, loan) => sum + loan.emi,
      0
    );

  const normalizedIncome =
    profile.monthlyIncome.max > 0
      ? (
          profile.monthlyIncome.min +
          profile.monthlyIncome.max
        ) / 2
      : 0;

  if (
    normalizedIncome > 0 &&
    existingEmi / normalizedIncome >= 0.4
  ) {
    min += 1;
    max += 2;

    reasons.push(
      "Existing EMIs consume a high share of income, increasing repayment risk."
    );
  } else if (
    normalizedIncome > 0 &&
    existingEmi / normalizedIncome >= 0.3
  ) {
    min += 0.5;
    max += 1;

    reasons.push(
      "Existing debt increases repayment risk and slightly raises the indicative rate range."
    );
  } else if (existingEmi > 0) {
    min += 0.25;
    max += 0.5;

    reasons.push(
      "Existing debt increases repayment risk slightly."
    );
  }

  /*
   * Recent repayment problems
   */
  if ((profile.pastBounces ?? 0) > 0) {
    min += 1;
    max += 2;

    reasons.push(
      "A recent EMI bounce increases the indicative pricing range because it signals repayment stress."
    );
  }

  /*
   * Secured products generally have lower base pricing.
   * The product band already captures this, so we do not
   * apply an additional collateral discount here.
   */
  if (
    profile.loan.type === "lap" ||
    profile.loan.type === "gold"
  ) {
    reasons.push(
      "The selected secured product has a lower base pricing range than typical unsecured borrowing."
    );
  }

  /*
   * Keep the output within a sensible model range.
   */
  min = Math.max(6, min);
  max = Math.min(24, max);

  /*
   * Never allow min > max after adjustments.
   */
  if (min > max) {
    min = max - 1;
  }

  return {
    fairRate: {
      min: Number(min.toFixed(2)),
      max: Number(max.toFixed(2)),
    },
    reasons,
  };
}