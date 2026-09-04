import type { BorrowerProfile } from "../../types/borrower";

export type IncomeRangeAnswer = {
  min?: number;
  max?: number;
};

export type Answers = Record<
  string,
  | string
  | number
  | boolean
  | IncomeRangeAnswer
  | undefined
>;

export type AnswerValue = Answers[string];

function deriveIncomeStability(
  min: number,
  max: number
): BorrowerProfile["monthlyIncome"]["stability"] {
  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    min <= 0 ||
    max <= 0
  ) {
    return "highly_variable";
  }

  const normalizedMin = Math.min(min, max);
  const normalizedMax = Math.max(min, max);

  const midpoint =
    (normalizedMin + normalizedMax) / 2;

  if (midpoint <= 0) {
    return "highly_variable";
  }

  const variationRatio =
    (normalizedMax - normalizedMin) /
    midpoint;

  /*
   * Income variation thresholds:
   *
   * <= 20%  -> stable
   * <= 40%  -> variable
   * > 40%   -> highly variable
   *
   * These are application assumptions used
   * to create a conservative affordability estimate.
   */
  if (variationRatio <= 0.20) {
    return "stable";
  }

  if (variationRatio <= 0.40) {
    return "variable";
  }

  return "highly_variable";
}

export function buildBorrowerProfile(
  answers: Answers
): BorrowerProfile {
  const incomeRange = answers.monthlyIncome;
  const rawIncomeMin =
    typeof incomeRange === "object" && incomeRange !== null
      ? Number(incomeRange.min ?? 0)
      : 0;
  const rawIncomeMax =
    typeof incomeRange === "object" && incomeRange !== null
      ? Number(incomeRange.max ?? incomeRange.min ?? 0)
      : 0;

  /*
   * Normalize the range so min is always
   * lower than max even if the borrower
   * accidentally enters them in reverse.
   */
  const incomeMin = Math.min(
    rawIncomeMin,
    rawIncomeMax
  );

  const incomeMax = Math.max(
    rawIncomeMin,
    rawIncomeMax
  );

  const incomeStability =
    deriveIncomeStability(
      incomeMin,
      incomeMax
    );

  const employmentType =
    answers.employmentType as BorrowerProfile["employmentType"];

  const loanType =
    answers.loanType as BorrowerProfile["loan"]["type"];

  const existingEmi = Number(
    answers.existingEmi ?? 0
  );

  const otherHouseholdIncomeAmount = Number(
    answers.otherHouseholdIncome ?? 0
  );

  return {
    age: Number(
      answers.age ?? 0
    ),

    employmentType,

    monthlyIncome: {
      min: incomeMin,
      max: incomeMax,
      stability: incomeStability,
    },

    otherHouseholdIncome:
      Number.isFinite(otherHouseholdIncomeAmount) &&
      otherHouseholdIncomeAmount > 0
        ? {
            monthly: otherHouseholdIncomeAmount,
            stability: "stable",
          }
        : undefined,

    monthlyHouseholdExpenses: Number(
      answers.householdExpenses ?? 0
    ),

    existingLoans:
      existingEmi > 0
        ? [
            {
              type: "personal",
              outstanding: 0,
              emi: existingEmi,
            },
          ]
        : [],

    loan: {
      type: loanType,

      amountWanted: Number(
        answers.loanAmount ?? 0
      ),

      purpose: String(
        answers.purpose ?? ""
      ),
    },

    creditScore:
      answers.creditScoreKnown === true &&
      answers.creditScore !== undefined
        ? Number(
            answers.creditScore
          )
        : undefined,

    emergencySavingsMonths:
      answers.emergencySavingsMonths !==
      undefined
        ? Number(
            answers.emergencySavingsMonths
          )
        : undefined,

    collateral:
      answers.collateralAvailable !==
      undefined
        ? {
            available: Boolean(
              answers.collateralAvailable
            ),

            value:
              answers.collateralValue !==
                undefined
                ? Number(
                    answers.collateralValue
                  )
                : undefined,
          }
        : undefined,

    upcomingExpenses:
      answers.upcomingExpenses !==
      undefined
        ? Number(
            answers.upcomingExpenses
          )
        : undefined,

    pastBounces:
      answers.pastBounces !== undefined
        ? Number(
            answers.pastBounces
          )
        : undefined,

    employmentTenureMonths:
      answers.employmentTenureMonths !==
      undefined
        ? Number(
            answers.employmentTenureMonths
          )
        : undefined,

    business:
      employmentType ===
      "self_employed"
        ? {
            yearsOperating:
              answers.businessYears !==
              undefined
                ? Number(
                    answers.businessYears
                  )
                : undefined,

            annualItrIncome:
              answers.annualItrIncome !==
              undefined
                ? Number(
                    answers.annualItrIncome
                  )
                : undefined,
          }
        : undefined,
  };
}
