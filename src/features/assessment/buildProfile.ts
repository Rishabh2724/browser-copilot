import type { BorrowerProfile } from "../../types/borrower";

export type Answers = Record<
  string,
  string | number | boolean | undefined
>;

export function buildBorrowerProfile(
  answers: Answers
): BorrowerProfile {
  const income =
    Number(answers.monthlyIncome ?? 0);

  const employmentType =
    answers.employmentType as BorrowerProfile["employmentType"];

  const loanType =
    answers.loanType as BorrowerProfile["loan"]["type"];

  return {
    age: Number(answers.age ?? 0),

    employmentType,

    monthlyIncome: {
      min: income,
      max: income,
      stability:
        (answers.incomeStability ??
          "variable") as BorrowerProfile["monthlyIncome"]["stability"],
    },

    monthlyHouseholdExpenses:
      Number(answers.householdExpenses ?? 0),

    existingLoans:
      Number(answers.existingEmi ?? 0) > 0
        ? [
            {
              type: "personal",
              outstanding: 0,
              emi: Number(
                answers.existingEmi ?? 0
              ),
            },
          ]
        : [],

    loan: {
      type: loanType,
      amountWanted:
        Number(answers.loanAmount ?? 0),
      purpose: String(
        answers.purpose ?? ""
      ),
    },

    creditScore:
      answers.creditScoreKnown === true &&
      answers.creditScore !== undefined
        ? Number(answers.creditScore)
        : undefined,

    emergencySavingsMonths:
      answers.emergencySavingsMonths !== undefined
        ? Number(
            answers.emergencySavingsMonths
          )
        : undefined,

    collateral:
      answers.collateralAvailable !== undefined
        ? {
            available:
              Boolean(
                answers.collateralAvailable
              ),
          }
        : undefined,

    upcomingExpenses:
      answers.upcomingExpenses !== undefined
        ? Number(answers.upcomingExpenses)
        : undefined,

    pastBounces:
      answers.pastBounces !== undefined
        ? Number(answers.pastBounces)
        : undefined,
  };
}