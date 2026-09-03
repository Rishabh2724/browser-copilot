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

export function determineBorrowDecision(
  profile: BorrowerProfile
): BorrowDecisionResult {
  const affordability =
    calculateAffordability(profile);

  const safeAmount =
    calculateSafeAmount(profile);

  const reasons: string[] = [];

  if (
    affordability.safeNewEmiCapacity <= 0
  ) {
    return {
      decision: "dont_borrow",
      reasons: [
        "Existing debt already consumes the conservative repayment capacity."
      ],
    };
  }

  if (
    safeAmount.max <
    profile.loan.amountWanted * 0.5
  ) {
    return {
      decision: "dont_borrow",
      reasons: [
        "The requested amount is substantially above the estimated safe borrowing capacity."
      ],
    };
  }

  if (
    safeAmount.max <
    profile.loan.amountWanted
  ) {
    reasons.push(
      "The requested amount is higher than the estimated safe borrowing capacity."
    );

    return {
      decision: "borrow_less",
      reasons,
    };
  }

  reasons.push(
    "The requested amount appears compatible with the estimated conservative repayment capacity."
  );

  return {
    decision: "borrow",
    reasons,
  };
}