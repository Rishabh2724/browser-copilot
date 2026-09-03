import type { BorrowerProfile } from "../types/borrower";
import { calculateAffordability } from "./affordability";
import { calculateSafeAmount } from "./safeAmount";
import { calculateRiskSignals } from "./riskSignals";

export type BorrowDecision =
  | "borrow"
  | "borrow_less"
  | "dont_borrow";

export interface BorrowDecisionResult {
  decision: BorrowDecision;
  reasons: string[];
}

interface StressResult {
  affordabilityStatus: "safe" | "tight" | "unsafe";
}

export function determineBorrowDecision(
  profile: BorrowerProfile,
  stressTest?: StressResult
): BorrowDecisionResult {
  const affordability = calculateAffordability(profile);
  const safeAmount = calculateSafeAmount(profile);
  const riskSignals = calculateRiskSignals(profile);

  const reasons: string[] = [];

  const criticalCreditRisk = riskSignals.some(
    (signal) => signal.id === "very_weak_credit"
  );

  const criticalDebtRisk = riskSignals.some(
    (signal) => signal.id === "critical_existing_debt"
  );

  const repaymentIssue = riskSignals.some(
    (signal) => signal.id === "repayment_issue"
  );

  if (affordability.safeNewEmiCapacity <= 0) {
    return {
      decision: "dont_borrow",
      reasons: [
        "Existing debt already consumes the conservative repayment capacity.",
      ],
    };
  }

  // Very weak credit becomes a hard stop only when combined
  // with another material repayment risk.
  if (
    criticalCreditRisk &&
    (
      stressTest?.affordabilityStatus === "unsafe" ||
      criticalDebtRisk ||
      repaymentIssue
    )
  ) {
    return {
      decision: "dont_borrow",
      reasons: [
        "The credit profile is very weak and another material repayment-risk signal is present.",
        "Taking additional debt in this situation could increase the likelihood of unaffordable repayment or limited lender options.",
      ],
    };
  }

  if (safeAmount.max < profile.loan.amountWanted * 0.5) {
    return {
      decision: "dont_borrow",
      reasons: [
        "The requested amount is substantially above the estimated safe borrowing capacity.",
      ],
    };
  }

  if (safeAmount.max < profile.loan.amountWanted) {
    reasons.push(
      "The requested amount is higher than the estimated safe borrowing capacity."
    );

    if (criticalCreditRisk) {
      reasons.push(
        "The very weak credit profile is likely to narrow lender options and increase borrowing cost."
      );
    }

    if (stressTest?.affordabilityStatus === "unsafe") {
      reasons.push(
        "The proposed repayment becomes unsafe under a 20% income-drop stress test."
      );
    }

    return {
      decision: "borrow_less",
      reasons,
    };
  }

  if (stressTest?.affordabilityStatus === "unsafe") {
    return {
      decision: "borrow_less",
      reasons: [
        "The requested amount fits the baseline affordability estimate but becomes unsafe if income falls by 20%.",
        "Reducing the amount or extending the repayment period can create more repayment room.",
        ...(criticalCreditRisk
          ? [
              "The very weak credit profile also makes the requested borrowing less suitable.",
            ]
          : []),
      ],
    };
  }

  if (criticalCreditRisk) {
    return {
      decision: "borrow_less",
      reasons: [
        "The requested amount is affordable at baseline, but the very weak credit profile makes additional borrowing less suitable.",
        "Consider a smaller amount and compare secured or lower-cost alternatives where appropriate.",
      ],
    };
  }

  if (stressTest?.affordabilityStatus === "tight") {
    reasons.push(
      "The requested amount is affordable at baseline but becomes tight under a 20% income-drop stress test."
    );
  } else {
    reasons.push(
      "The requested amount appears compatible with the estimated conservative repayment capacity and passes the income stress test."
    );
  }

  return {
    decision: "borrow",
    reasons,
  };
}