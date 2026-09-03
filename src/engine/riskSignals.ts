import type { BorrowerProfile } from "../types/borrower";
import { getNormalizedIncome } from "./income";

export type RiskSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface RiskSignal {
  id: string;
  severity: RiskSeverity;
  title: string;
  explanation: string;
}

export function calculateRiskSignals(
  profile: BorrowerProfile
): RiskSignal[] {
  const signals: RiskSignal[] = [];

  const income = getNormalizedIncome(profile);

  const existingEmi = profile.existingLoans.reduce(
    (sum, loan) => sum + loan.emi,
    0
  );

  const existingDebtRatio =
    income > 0 ? existingEmi / income : 1;

  if (existingDebtRatio >= 0.4) {
    signals.push({
      id: "critical_existing_debt",
      severity: "critical",
      title: "Existing debt is already very high",
      explanation:
        "Current loan payments consume at least 40% of normalized income.",
    });
  } else if (existingDebtRatio >= 0.3) {
    signals.push({
      id: "high_existing_debt",
      severity: "high",
      title: "Existing debt is significant",
      explanation:
        "Current loan payments consume a large share of normalized income.",
    });
  }

  if (profile.monthlyIncome.stability === "highly_variable") {
    signals.push({
      id: "income_volatility",
      severity: "high",
      title: "Income is highly variable",
      explanation:
        "A large income fluctuation can make a fixed EMI harder to sustain.",
    });
  }

  if (
    profile.pastBounces !== undefined &&
    profile.pastBounces > 0
  ) {
    signals.push({
      id: "repayment_issue",
      severity: "high",
      title: "Recent repayment issue",
      explanation:
        "A recent bounced payment is a warning sign when considering additional borrowing.",
    });
  }

  // Credit score is treated as a risk signal rather than an
  // automatic rejection rule because lender eligibility
  // thresholds vary by product.
  if (profile.creditScore !== undefined) {
    const score = profile.creditScore;

    if (score < 550) {
      signals.push({
        id: "very_weak_credit",
        severity: "critical",
        title: "Very weak credit profile",
        explanation:
          `The entered credit score of ${score} is substantially below the assessment's fair-credit range, which can reduce lender options and increase borrowing cost.`,
      });
    } else if (score < 650) {
      signals.push({
        id: "weak_credit",
        severity: "high",
        title: "Weak credit profile",
        explanation:
          `The entered credit score of ${score} is below the assessment's fair-credit range, which can reduce lender options and increase borrowing cost.`,
      });
    } else if (score < 700) {
      signals.push({
        id: "fair_credit",
        severity: "medium",
        title: "Fair credit profile",
        explanation:
          `The entered credit score of ${score} is in the assessment's fair-credit range but may not qualify for the lowest borrowing rates.`,
      });
    }
  }

  return signals;
}