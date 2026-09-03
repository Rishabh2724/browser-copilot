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
  // 1. Calculate the core affordability and risk inputs.
  const affordability = calculateAffordability(profile);

  const lenderAmount = calculateLenderAmount(profile);

  const safeAmount = calculateSafeAmount(profile);

  const rate = calculateFairRate(profile);

  const confidence = calculateConfidence(profile);

  // 2. Calculate tenure options before making the final decision.
  const tenureOptions = calculateTenureOptions(profile);

  const initialTenure =
    tenureOptions.find(
      (option) =>
        option.emi <=
        affordability.safeNewEmiCapacity
    ) ??
    tenureOptions[tenureOptions.length - 1];

  // 3. Run a preliminary stress test using the requested amount.
  //
  // This gives the decision engine information about whether
  // the requested loan survives a 20% income-drop scenario.
  const initialStressTest =
    runIncomeStressTest(
      profile,
      calculateEMI(
        profile.loan.amountWanted,
        (rate.fairRate.min +
          rate.fairRate.max) / 2,
        initialTenure.months
      )
    );

  // 4. Make the borrowing decision using affordability,
  // safe amount and stress-test results.
  const decision =
    determineBorrowDecision(
      profile,
      initialStressTest
    );

  // 5. Determine the amount we actually recommend.
  const recommendedAmount =
    decision.decision === "borrow"
      ? profile.loan.amountWanted
      : Math.min(
          profile.loan.amountWanted,
          safeAmount.max
        );

  // 6. Select a tenure that fits the conservative EMI ceiling.
  const recommendedTenure =
    tenureOptions.find(
      (option) =>
        option.emi <=
        affordability.safeNewEmiCapacity
    ) ??
    tenureOptions[tenureOptions.length - 1];

  // 7. Calculate APR using the recommended amount.
  const apr =
    calculateAPR(
      recommendedAmount,
      rate.fairRate,
      getProcessingFee(profile),
      recommendedTenure.months
    );

  // 8. Run the final stress test using the amount
  // that we are actually recommending to the borrower.
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

  // 9. Build explainability reasons for the UI
  // and Negotiation Card.
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
        ).toLocaleString(
          "en-IN"
        )} because it considers income, household expenses and existing EMIs.`,
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