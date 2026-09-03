import type { BorrowerProfile } from "../types/borrower";
import type { AssessmentResult } from "../types/assessment";

import { calculateAffordability } from "./affordability";
import { calculateLenderAmount } from "./sanction";
import { calculateSafeAmount } from "./safeAmount";
import { calculateFairRate } from "./rateBand";
import { determineBorrowDecision } from "./borrowingDecision";
import { calculateConfidence } from "./confidence";
import { calculateTenureOptions } from "./tenureOptions";
import { calculateAPR } from "./apr";
import { runIncomeStressTest } from "./stressTest";
import { calculateEMI } from "./emi";

export function assessBorrower(
  profile: BorrowerProfile
): AssessmentResult {
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

  const tenureOptions =
    calculateTenureOptions(profile);

  const recommendedAmount =
    decision.decision === "borrow"
      ? profile.loan.amountWanted
      : Math.min(
          profile.loan.amountWanted,
          safeAmount.max
        );

  const recommendedTenure =
    tenureOptions.find(
      (option) =>
        option.emi <=
        affordability.safeNewEmiCapacity
    ) ?? tenureOptions[tenureOptions.length - 1];

  const apr =
    calculateAPR(
      recommendedAmount,
      rate.fairRate,
      getProcessingFee(profile),
      recommendedTenure.months
    );

  const stressTest =
    runIncomeStressTest(
      profile,
      calculateEMI(
        recommendedAmount,
        (rate.fairRate.min +
          rate.fairRate.max) / 2,
        recommendedTenure.months
      )
    );

  const reasons = [
    ...decision.reasons.map((reason) => ({
      title: "Borrowing decision",
      explanation: reason,
    })),
    ...rate.reasons.map((reason) => ({
      title: "Rate adjustment",
      explanation: reason,
    })),
    {
      title: "Safe EMI",
      explanation:
        `The conservative EMI ceiling is approximately ₹${Math.round(
          affordability.safeNewEmiCapacity
        ).toLocaleString("en-IN")} because it considers income, household expenses and existing EMIs.`,
    },
  ];

  return {
    decision: decision.decision,

    lenderAmount,

    safeAmount,

    recommendedAmount,

    fairRate: rate.fairRate,

    apr,

    emiCeiling:
      Math.round(
        affordability.safeNewEmiCapacity
      ),

    tenureOptions,

    stressTest,

    confidence,

    reasons,

    negotiationCard: {
      fairRate: rate.fairRate,
      apr,
      safeEmi:
        Math.round(
          affordability.safeNewEmiCapacity
        ),
      recommendedAmount,
      reasons,
    },
  };
}

function getProcessingFee(
  profile: BorrowerProfile
): number {
  const offer = profile.offers?.[0];

  return offer?.processingFee ?? 0;
}