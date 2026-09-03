import type { BorrowerProfile } from "../types/borrower";

import { calculateAffordability } from "./affordability";
import { calculateLenderAmount } from "./sanction";
import { calculateSafeAmount } from "./safeAmount";
import { calculateFairRate } from "./rateBand";
import { determineBorrowDecision } from "./borrowingDecision";
import { calculateConfidence  } from "./confidence";

export function assessBorrower(
  profile: BorrowerProfile
) {
  const affordability =
    calculateAffordability(profile);

  const lenderAmount =
    calculateLenderAmount(profile);

  const safeAmount =
    calculateSafeAmount(profile);

  const rate =
    calculateFairRate(profile);

  const decision =
    determineBorrowDecision(profile);

  const confidence =
    calculateConfidence(profile);

  return {
    affordability,

    decision,

    lenderAmount,

    safeAmount,

    fairRate: rate.fairRate,

    rateReasons: rate.reasons,

    confidence,
  };
}