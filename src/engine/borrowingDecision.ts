import type { BorrowerProfile } from "../types/borrower";
import { calculateAffordability } from "./affordability";
import { calculateSafeAmount } from "./safeAmount";

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

  const reasons: string[] = [];

  if (affordability.safeNewEmiCapacity <= 0) {
    return {
      decision: "dont_borrow",
      reasons: [
        "Existing debt already consumes the conservative repayment capacity.",
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