import type { BorrowerProfile } from "../types/borrower";

export interface ConfidenceResult {
  level: "low" | "medium" | "high";
  score: number;
  reasons: string[];
}

export function calculateConfidence(
  profile: BorrowerProfile
): ConfidenceResult {
  const checks = [
    {
      label: "Income provided",
      complete:
        profile.monthlyIncome.min > 0 &&
        profile.monthlyIncome.max > 0,
      weight: 3,
    },

    {
      label: "Employment type provided",
      complete: Boolean(profile.employmentType),
      weight: 2,
    },

    {
      label: "Household expenses provided",
      complete: profile.monthlyHouseholdExpenses > 0,
      weight: 3,
    },

    {
      label: "Existing debt information provided",
      complete: Array.isArray(profile.existingLoans),
      weight: 3,
    },

    {
      label: "Loan amount provided",
      complete: profile.loan.amountWanted > 0,
      weight: 2,
    },

    {
      label: "Loan purpose provided",
      complete: Boolean(profile.loan.purpose?.trim()),
      weight: 1,
    },

    {
      label: "Credit score available",
      complete: profile.creditScore !== undefined,
      weight: 2,
    },

    {
      label: "Income stability provided",
      complete: Boolean(profile.monthlyIncome.stability),
      weight: 2,
    },

    {
      label: "Age provided",
      complete: profile.age > 0,
      weight: 1,
    },
  ];

  const totalWeight = checks.reduce(
    (sum, check) => sum + check.weight,
    0
  );

  const completedWeight = checks
    .filter((check) => check.complete)
    .reduce((sum, check) => sum + check.weight, 0);

const rawScore =
  completedWeight / totalWeight;

const score = Math.min(rawScore, 0.9);

  let level: "low" | "medium" | "high";

  if (score >= 0.8) {
    level = "high";
  } else if (score >= 0.6) {
    level = "medium";
  } else {
    level = "low";
  }

  const reasons = checks
    .filter((check) => !check.complete)
    .map(
      (check) =>
        `${check.label} is unavailable, so the assessment range is wider.`
    );

  // Credit score is particularly important for rate estimation.
  if (profile.creditScore === undefined) {
    reasons.push(
      "Credit score is unknown, so the fair-rate estimate has lower confidence."
    );
  }

  // Variable income should reduce confidence in affordability calculations.
  if (
    profile.monthlyIncome.stability === "variable" ||
    profile.monthlyIncome.stability === "highly_variable"
  ) {
    reasons.push(
      "Income varies month to month, so affordability is estimated conservatively."
    );
  }

  return {
    level,
    score: Number(score.toFixed(2)),
    reasons,
  };
}