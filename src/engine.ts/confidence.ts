import type { BorrowerProfile } from "../types/borrower";

export function calculateConfidence(
  profile: BorrowerProfile
) {
  const checks = [
    {
      label: "Income provided",
      complete: profile.monthlyIncome.max > 0,
    },
    {
      label: "Employment type provided",
      complete: Boolean(profile.employmentType),
    },
    {
      label: "Existing debt provided",
      complete: Boolean(profile.existingLoans),
    },
    {
      label: "Household expenses provided",
      complete:
        profile.monthlyHouseholdExpenses > 0,
    },
    {
      label: "Credit score available",
      complete:
        profile.creditScore !== undefined,
    },
  ];

  const completed =
    checks.filter((item) => item.complete).length;

  const score =
    completed / checks.length;

  let level:
    | "low"
    | "medium"
    | "high";

  if (score >= 0.8) {
    level = "high";
  } else if (score >= 0.6) {
    level = "medium";
  } else {
    level = "low";
  }

  return {
    level,
    score,
    reasons: checks
      .filter((item) => !item.complete)
      .map(
        (item) =>
          `${item.label} is unavailable.`
      ),
  };
}